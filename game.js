(() => {
const canvas=document.getElementById('game'), start=document.getElementById('start');
const $=id=>document.getElementById(id);
let scene,camera,renderer,clock,player,weapon,view='first',running=false,locked=false;
let keys={},yaw=0,pitch=0,health=100,stamina=100,ammo=30,reserve=120,score=0,elapsed=0,lastShot=0,toastTimer=0;
const colliders=[],targets=[],beacons=[],raycaster=new THREE.Raycaster();
const mat=(color,roughness=0.9,metalness=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
const mats={ground:mat(0x343b3d),wall:mat(0x596065),dark:mat(0x222a30),metal:mat(0x35444b,.45,.65),red:mat(0x9e242c,.45,.35),glass:new THREE.MeshStandardMaterial({color:0x263d49,roughness:.3,metalness:.4})};
function box(x,y,z,sx,sy,sz,material,collide=true){let m=new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz),material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;scene.add(m);if(collide)colliders.push({x,z,hx:sx/2,hz:sz/2,top:y+sy/2});return m}
function build(){
 scene=new THREE.Scene();scene.background=new THREE.Color(0x8a9ba5);scene.fog=new THREE.Fog(0x8a9ba5,35,145);
 camera=new THREE.PerspectiveCamera(75,innerWidth/innerHeight,.1,250);
 renderer=new THREE.WebGLRenderer({canvas,antialias:false,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 scene.add(new THREE.HemisphereLight(0xc9e3f3,0x31312c,2.1));
 let sun=new THREE.DirectionalLight(0xffe5c5,2.3);sun.position.set(-25,45,20);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-70;sun.shadow.camera.right=70;sun.shadow.camera.top=70;sun.shadow.camera.bottom=-70;scene.add(sun);
 let ground=new THREE.Mesh(new THREE.PlaneGeometry(220,220),mats.ground);ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);
 // Streets, broken pavements and urban blocks
 box(0,.015,0,15,.03,180,mat(0x252b2d),false);box(0,.02,0,180,.03,15,mat(0x252b2d),false);
 for(let i=0;i<2;i++){let x=i?8:-8;for(let z=-75;z<=75;z+=10){box(x,.04,z,.16,.04,4,mat(0x8b887b),false)}}
 for(let i=0;i<46;i++){
  let side=Math.random()<.5?-1:1, x=side*(14+Math.random()*40),z=-78+Math.random()*156,w=5+Math.random()*8,d=5+Math.random()*9,h=5+Math.random()*20;
  box(x,h/2,z,w,h,d,mat([0x41494c,0x4a4c4b,0x5b5d59,0x363f43][i%4]));
  for(let yy=2;yy<h-1;yy+=3)for(let xx=-w/2+1;xx<w/2-1;xx+=2.2){
   let win=new THREE.Mesh(new THREE.BoxGeometry(.8,1.15,.06),mats.glass);win.position.set(x+xx,yy,z-d/2-.04);scene.add(win);
  }
 }
 // cover objects
 for(let i=0;i<26;i++){let x=(Math.random()-.5)*28,z=(Math.random()-.5)*120;if(Math.abs(x)<5)continue;
  if(i%3===0){box(x,.7,z,3.2,1.4,1.4,mats.dark);let tire= new THREE.Mesh(new THREE.TorusGeometry(.34,.13,8,14),mats.metal);tire.rotation.y=Math.PI/2;tire.position.set(x-1.1,.35,z);scene.add(tire);tire= new THREE.Mesh(new THREE.TorusGeometry(.34,.13,8,14),mats.metal);tire.rotation.y=Math.PI/2;tire.position.set(x+1.1,.35,z);scene.add(tire)}
  else box(x,.65,z,1.8,1.3,1.3,i%2?mats.metal:mats.dark);
 }
 // lamp posts
 for(let z=-65;z<=65;z+=22){for(let x of [-10,10]){let pole=new THREE.Mesh(new THREE.CylinderGeometry(.07,.1,5,7),mats.dark);pole.position.set(x,2.5,z);scene.add(pole);box(x+.45,4.9,z,.9,.12,.22,mat(0xd0c7a5),false)}}
 // mission beacons
 for(let p of [[-5,0,-25],[5,0,-52],[3,0,22]]){let g=new THREE.Group();g.position.set(...p);scene.add(g);
  let base=new THREE.Mesh(new THREE.CylinderGeometry(.45,.6,.25,12),mats.dark);base.position.y=.13;g.add(base);
  let core=new THREE.Mesh(new THREE.CylinderGeometry(.18,.24,1.25,8),mat(0x20d9c6,.3,.3));core.position.y=.85;g.add(core);
  let ring=new THREE.Mesh(new THREE.TorusGeometry(.6,.035,6,20),mat(0x25e4d0,.3,.2));ring.rotation.x=Math.PI/2;ring.position.y=.4;g.add(ring);beacons.push({group:g,active:true});
 }
 // training targets, animated mannequins
 for(let p of [[-3,0,-17],[4,0,-39],[-6,0,9],[8,0,-63]]){let g=new THREE.Group();g.position.set(...p);scene.add(g);
  let body=new THREE.Mesh(new THREE.CapsuleGeometry(.35,.85,4,8),mat(0x303b40));body.position.y=1.25;g.add(body);
  let head=new THREE.Mesh(new THREE.SphereGeometry(.23,10,8),mat(0x9dacae));head.position.y=2.05;g.add(head);
  let plate=new THREE.Mesh(new THREE.BoxGeometry(.45,.35,.12),mats.red);plate.position.set(0,1.35,.3);g.add(plate);
  targets.push({group:g,alive:true,phase:Math.random()*6});
 }
 player=new THREE.Group();player.position.set(0,0,5);scene.add(player);
 // visible body for third-person
 let body=new THREE.Mesh(new THREE.CapsuleGeometry(.32,.85,4,8),mat(0x26333b));body.position.y=1.15;body.castShadow=true;player.add(body);
 let head=new THREE.Mesh(new THREE.SphereGeometry(.22,12,10),mat(0x8c999d));head.position.y=1.88;player.add(head);
 let pack=box(0,0,0,.42,.52,.22,mat(0x333c32),false);pack.position.set(0,1.25,-.28);player.add(pack);
 // weapon model parented to camera, visible in first-person
 weapon=new THREE.Group();camera.add(weapon);
 let gun= new THREE.Mesh(new THREE.BoxGeometry(.16,.18,.72),mats.dark);gun.position.set(.32,-.28,-.65);weapon.add(gun);
 let barrel=new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,.38,8),mats.metal);barrel.rotation.x=Math.PI/2;barrel.position.set(.32,-.24,-1.15);weapon.add(barrel);
 let sight=new THREE.Mesh(new THREE.BoxGeometry(.07,.07,.12),mats.red);sight.position.set(.32,-.16,-.68);weapon.add(sight);
}
function showToast(s){$('toast').textContent=s;$('toast').style.opacity=1;toastTimer=2.2}
function setView(){view=view==='first'?'third':'first';$('hint').textContent=view==='first'?'FPS · V CHANGER DE CAMÉRA · E INTERAGIR':'TPS · V CHANGER DE CAMÉRA · E INTERAGIR';player.children.forEach(c=>c.visible=view==='third');weapon.visible=view==='first';}
function shoot(){if(!running||!locked)return;let now=performance.now();if(now-lastShot<155)return;lastShot=now;if(ammo<=0){showToast('CHARGEUR VIDE — APPUIE SUR R');return}ammo--;$('ammo').textContent=ammo;
 raycaster.setFromCamera(new THREE.Vector2(0,0),camera);let objects=[];targets.filter(t=>t.alive).forEach(t=>t.group.traverse(o=>{if(o.isMesh)objects.push(o)}));
 let hits=raycaster.intersectObjects(objects,false);
 if(hits.length){let t=targets.find(t=>{let found=false;t.group.traverse(o=>{if(o===hits[0].object)found=true});return found});if(t){t.alive=false;scene.remove(t.group);score++;$('hitmarker').style.opacity=1;setTimeout(()=>$('hitmarker').style.opacity=0,100);showToast('CIBLE NEUTRALISÉE · +100 XP');}}
 if(view==='first'){weapon.position.z=.08;setTimeout(()=>weapon.position.z=0,65)}
}
function reload(){if(ammo===30||reserve<=0)return;let n=Math.min(30-ammo,reserve);ammo+=n;reserve-=n;$('ammo').textContent=ammo;showToast('RECHARGEMENT TERMINÉ')}
function interact(){let b=beacons.find(b=>b.active&&b.group.position.distanceTo(player.position)<3.3);if(b){b.active=false;scene.remove(b.group);score+=250;$('objective').textContent=`Balises : ${beacons.filter(b=>!b.active).length} / 3`;showToast('BALISE RÉCUPÉRÉE · +250 XP');if(beacons.every(b=>!b.active))showToast('OBJECTIF ACCOMPLI · SECTEUR SÉCURISÉ');return}showToast('AUCUNE INTERACTION À PORTÉE')}
function blocked(x,z){for(let c of colliders){if(Math.abs(x-c.x)<c.hx+.42&&Math.abs(z-c.z)<c.hz+.42)return true}return false}
function update(dt){
 elapsed+=dt;$('clock').textContent=new Date(elapsed*1000).toISOString().slice(14,19);
 let forward=(keys.KeyW?1:0)-(keys.KeyS?1:0),side=(keys.KeyD?1:0)-(keys.KeyA?1:0),moving=forward||side;
 let sprint=(keys.ShiftLeft||keys.ShiftRight)&&stamina>1&&moving,speed=sprint?9:5.2;
 if(sprint)stamina=Math.max(0,stamina-24*dt);else stamina=Math.min(100,stamina+15*dt);
 $('stamina').textContent=Math.round(stamina);$('staminabar').style.width=stamina+'%';
 if(moving){let len=Math.hypot(forward,side);forward/=len;side/=len;let dx=(Math.sin(yaw)*forward+Math.cos(yaw)*side)*speed*dt,dz=(-Math.cos(yaw)*forward+Math.sin(yaw)*side)*speed*dt;
 let nx=player.position.x+dx,nz=player.position.z+dz;if(!blocked(nx,player.position.z))player.position.x=nx;if(!blocked(player.position.x,nz))player.position.z=nz;
 player.rotation.y=yaw+(view==='third'?Math.atan2(side,forward):0);
 }
 // Targets gently sway and turn toward player
 targets.filter(t=>t.alive).forEach(t=>{t.phase+=dt; t.group.rotation.y=Math.atan2(player.position.x-t.group.position.x,player.position.z-t.group.position.z);t.group.position.y=Math.sin(t.phase*1.7)*.035});
 let desired=new THREE.Vector3(),look=new THREE.Vector3(player.position.x,player.position.y+1.55,player.position.z);
 if(view==='first'){camera.position.set(player.position.x,player.position.y+1.62,player.position.z);camera.rotation.order='YXZ';camera.rotation.y=yaw;camera.rotation.x=pitch}
 else{desired.set(player.position.x+Math.sin(yaw)*4,player.position.y+3.1,player.position.z+Math.cos(yaw)*4);camera.position.lerp(desired,.18);camera.lookAt(look)}
 beacons.forEach(b=>{if(b.active){b.group.children[1].rotation.y+=dt*1.5;b.group.children[2].rotation.z+=dt*.8}});
 if(toastTimer>0){toastTimer-=dt;if(toastTimer<=0)$('toast').style.opacity=0}
 $('health').textContent=health;$('healthbar').style.width=health+'%';
 renderer.render(scene,camera);
}
let prev=0;function loop(t){requestAnimationFrame(loop);if(!running)return;let dt=Math.min((t-prev)/1000||0,.04);prev=t;update(dt)}
function begin(){if(running)return;running=true;start.style.display='none';if(!scene)build();setView();setView();canvas.requestPointerLock?.();showToast('DÉPLOIEMENT RÉUSSI');requestAnimationFrame(loop)}
$('play').addEventListener('click',begin);
document.addEventListener('pointerlockchange',()=>{locked=document.pointerLockElement===canvas});
document.addEventListener('mousemove',e=>{if(!locked)return;yaw-=e.movementX*.0022;pitch-=e.movementY*.0022;pitch=Math.max(-1.35,Math.min(1.35,pitch));if(view==='first'){camera.rotation.order='YXZ';camera.rotation.y=yaw;camera.rotation.x=pitch}});
document.addEventListener('keydown',e=>{keys[e.code]=true;if(e.code==='KeyV'&&running)setView();if(e.code==='KeyE'&&running)interact();if(e.code==='KeyR'&&running)reload();if(e.code==='Escape'&&running)showToast('CLIQUE SUR LE JEU POUR REPRENDRE');});
document.addEventListener('keyup',e=>keys[e.code]=false);
canvas.addEventListener('click',()=>{if(running&&!locked)canvas.requestPointerLock?.();else shoot()});
document.addEventListener('mousedown',e=>{if(e.button===0&&locked)shoot()});
addEventListener('resize',()=>{if(!camera||!renderer)return;camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,1.5))});
})();
