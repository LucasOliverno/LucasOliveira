import { useMemo, useEffect } from 'react';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';

function surface(kind) {
  const c=document.createElement('canvas'); c.width=c.height=512;
  const g=c.getContext('2d');
  g.fillStyle=kind==='wood'?'#664937':'#284B49';g.fillRect(0,0,512,512);
  let seed=47;const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  if(kind==='wood') {
    for(let i=0;i<950;i++) {let y=rnd()*512;g.beginPath();g.moveTo(0,y);g.bezierCurveTo(150,y+12*Math.sin(i),350,y-9*Math.cos(i),512,y+4);g.strokeStyle=`rgba(${i%3? '39,22,13':'184,136,86'},${.04+rnd()*.12})`;g.lineWidth=.5+rnd()*1.2;g.stroke();}
  } else {
    for(let i=0;i<21000;i++){g.fillStyle=`rgba(230,225,192,${rnd()*.05})`;g.fillRect(rnd()*512,rnd()*512,1,2);}
  }
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(kind==='wood'?3:8,kind==='wood'?3:8);return t;
}
export function TableFurniture({ radius }) {
  const wood=useMemo(()=>surface('wood'),[]),felt=useMemo(()=>surface('felt'),[]);
  useEffect(()=>()=>{wood.dispose();felt.dispose();},[wood,felt]);
  return <group>
    <mesh position={[0,-.94,0]} receiveShadow castShadow><cylinderGeometry args={[radius+7.6,radius+7.4,.9,128]}/><meshStandardMaterial map={wood} roughness={.58}/></mesh>
    <mesh position={[0,-.48,0]} receiveShadow><cylinderGeometry args={[radius+6.9,radius+6.9,.08,128]}/><meshStandardMaterial map={felt} roughness={1}/></mesh>
    {[radius+7.05,radius+7.35].map((r,i)=><mesh key={r} rotation={[Math.PI/2,0,0]} position={[0,-.45,0]}><torusGeometry args={[r,i?.055:.09,6,128]}/><meshStandardMaterial color={i?'#AA8854':'#382C24'} metalness={i?.45:0} roughness={.55}/></mesh>)}
    <mesh position={[0,-1.41,0]}><cylinderGeometry args={[radius+7.4,radius+7.15,.1,128]}/><meshStandardMaterial color="#302922" roughness={.7}/></mesh>
  </group>;
}
export function CityFrame({w,d,color}) {
  return <group>
    <RoundedBox args={[w+.82,.22,d+.82]} radius={.10} smoothness={2} position={[0,-.22,0]} receiveShadow castShadow><meshStandardMaterial color="#453B31" roughness={.7}/></RoundedBox>
    <RoundedBox args={[w+.62,.055,d+.62]} radius={.009} smoothness={2} position={[0,-.09,0]} receiveShadow><meshStandardMaterial color="#C9BDA3" roughness={.95}/></RoundedBox>
    {[-1,1].map(side=><mesh key={side} position={[0,-.17,side*(d/2+.37)]}><boxGeometry args={[w+.5,.07,.025]}/><meshStandardMaterial color={color} roughness={.65}/></mesh>)}
    {[[-1,-1],[-1,1],[1,-1],[1,1]].map(([x,z])=><mesh key={`${x}${z}`} position={[x*(w/2+.27),-.05,z*(d/2+.27)]}><cylinderGeometry args={[.035,.035,.012,12]}/><meshStandardMaterial color="#B09058" metalness={.5} roughness={.4}/></mesh>)}
  </group>;
}
export function BoardFoundation({w,d}) {
  return <group>
    <RoundedBox args={[w+.15,.22,d+.15]} radius={.09} smoothness={3} position={[0,-.16,0]} castShadow receiveShadow><meshStandardMaterial color="#343D39" roughness={.75}/></RoundedBox>
    <RoundedBox args={[w-.12,.045,d-.12]} radius={.015} smoothness={3} position={[0,-.035,0]} receiveShadow><meshStandardMaterial color="#B69B65" roughness={.65} metalness={.12}/></RoundedBox>
    <RoundedBox args={[w-.28,.025,d-.28]} radius={.009} smoothness={3} position={[0,-.004,0]} receiveShadow><meshStandardMaterial color="#E3D9C2" roughness={.95}/></RoundedBox>
  </group>;
}
export function SectionTray({pos,size,color='#F1E8D4'}) {
 return <group position={[pos[0],0,pos[1]]}>
  <RoundedBox args={[size[0],.022,size[1]]} radius={.009} smoothness={2} position={[0,.015,0]} receiveShadow><meshStandardMaterial color={color} roughness={.95}/></RoundedBox>
  {[-1,1].map(s=><mesh key={s} position={[0,.032,s*(size[1]/2-.025)]}><boxGeometry args={[size[0]-.08,.008,.014]}/><meshStandardMaterial color="#B6A886" roughness={.8}/></mesh>)}
 </group>;
}
export function RegionalTray({x}) {
 return <RoundedBox args={[1.17,.10,4.65]} radius={.035} smoothness={2} position={[x,-.13,0]} receiveShadow><meshStandardMaterial color="#D1C6AD" roughness={.95}/></RoundedBox>;
}
