import * as THREE from 'three';

const boardBack =  new THREE.Mesh(                                      
    new THREE.PlaneGeometry(200, 200),
    new THREE.MeshStandardMaterial({ 
    color: "palegreen",
    })
);
boardBack.name = "boardBack";
boardBack.rotation.set(-Math.PI/2, 0, 0);
boardBack.receiveShadow = true;
boardBack.castShadow = true;

const genZone = (mode:"MONSTER"|"OTHER",x:number)=>{
    const points = [
        new THREE.Vector3( -7.5, 0, -10 ),
        new THREE.Vector3( 7.5, 0, -10 ),
        new THREE.Vector3( 7.5, 0, 10 ),
        new THREE.Vector3( -7.5, 0, 10 ),
        new THREE.Vector3( -7.5, 0, -10 )
    ];
    const zoneFrame = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(points),
        new THREE.LineBasicMaterial({color: "red"})
    );
    zoneFrame.receiveShadow = true;
    const zoneMaterial = new THREE.Mesh(
        new THREE.PlaneBufferGeometry(15, 20),
        new THREE.MeshBasicMaterial({color:"pink"})
    );
    zoneMaterial.receiveShadow = true;
    zoneMaterial.rotation.set(-Math.PI/2, 0, 0);

    const result = new THREE.Group()
    if(mode=="MONSTER"){
        const atk = new THREE.Group().add(zoneFrame,zoneMaterial);
        const def = atk.clone();
        def.rotation.set(0, -Math.PI/2, 0);
        result.add(atk,def);  
    }else if(mode=="OTHER"){
        result.add(zoneFrame,zoneMaterial);  
    };
    result.position.set(x, 0, 0);
    result.receiveShadow = true;
    return result
};
const ZoneGroup = ()=>{
    const ZoneHorizon = (vertical:"front" | "back")=>{
        const zoneHorizonLine = new THREE.Group();
        if(vertical=="back"){
            for (let H = 0; H < 7; H++) {
                zoneHorizonLine.add(
                    genZone("OTHER",-75 + H*25)
                )
            };
            zoneHorizonLine.position.set(0, 0, -12.5)
        }else if(vertical=="front"){
            for (let H = 0; H < 7; H++) {
                if( 1<=H && H<=5){
                    zoneHorizonLine.add(genZone("MONSTER",-75 + H*25))
                }else{
                    zoneHorizonLine.add(
                        genZone("OTHER",-75 + H*25)
                    )
                };
            };
            zoneHorizonLine.position.set(0, 0, 12.5)
        };
        zoneHorizonLine.receiveShadow = true;
        return zoneHorizonLine;
    };
    const playerGroup = new THREE.Group().add(ZoneHorizon("front"),ZoneHorizon("back"));
    playerGroup.position.set(0, 0, -37.5);
    playerGroup.receiveShadow = true;
    const enemyGroup = new THREE.Group().add(ZoneHorizon("front"),ZoneHorizon("back"));
    enemyGroup.position.set(0, 0, 37.5);
    enemyGroup.rotation.set(0, Math.PI, 0);
    enemyGroup.receiveShadow = true;

    const result = new THREE.Group().add(playerGroup,enemyGroup);
    result.position.set(0, 0.1, 0);
    result.receiveShadow = true;
    return result;
};

const boardGroup : THREE.Group = new THREE.Group().add(boardBack,ZoneGroup())
boardGroup.receiveShadow = true;
export default boardGroup;
