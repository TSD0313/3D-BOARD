import * as THREE from 'three';
import { Tween } from 'createjs-module';
import BoardMesh from './genBoard'
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { DragControls } from "three/examples/jsm/controls/DragControls";

const cardSize = {x:13.5,y:18,margin:3};

// ページの読み込みを待つ
window.onload = function() {
    // サイズを指定
    const width = window.innerWidth;
    const height = window.innerHeight;

    // レンダラーを作成
    const mainCanv = <HTMLCanvasElement>document.querySelector('#myCanvas');
    const renderer = new THREE.WebGLRenderer({
      canvas: mainCanv,
      antialias: true
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
    // レンダラー側で影を有効に
    renderer.shadowMap.enabled = true;

    // シーンを作成
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#BBFFFF");

    // カメラを作成
    const camera = new THREE.PerspectiveCamera(70, width / height);
    camera.position.set( 0, 150, 180 );
    camera.lookAt(new THREE.Vector3(0, 0, 0));
    scene.add(camera)

    // 光源を作成
    const light = new THREE.SpotLight(0xFFFFFF, 1, 1000, Math.PI / 4, 10, 0.1);
    light.castShadow = true;
    light.position.set( 0, 150, 150 );
    light.lookAt(0,0,0)
    light.shadow.mapSize.width = 2048; 
    light.shadow.mapSize.height = 2048; 
    light.shadow.radius = 10;
    scene.add(light);

    const spotLightShadowHelper = new THREE.CameraHelper( light.shadow.camera);
    scene.add( spotLightShadowHelper);

    const spotLightHelper = new THREE.SpotLightHelper( light);
    scene.add( spotLightHelper);

    const axisHelper = new THREE.AxesHelper(1000);
    scene.add(axisHelper);

    // 初期化
    onResize();
    // リサイズイベント発生時に実行
    window.addEventListener('resize', onResize);
    function onResize() {
        // サイズを取得
        const width = window.innerWidth;
        const height = window.innerHeight;

        // レンダラーのサイズを調整
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(width, height);

        // カメラのアスペクト比を修正
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
    };

    scene.add(BoardMesh);

    const fontloader = new THREE.FontLoader();
    fontloader.load('fonts/helvetiker_regular.typeface.json',function (font) {
        const geo = new THREE.TextGeometry( '3D-BOARD',{font:font,size:1.5,height: 0.1,});
        geo.center();
        const mat = new THREE.MeshPhongMaterial({opacity:0.5,transparent:true});
        const mesh = new THREE.Mesh(geo,mat);
        camera.add(mesh);
        mesh.position.set(0,0,-15);
        mesh.lookAt(camera.position);
    });

    const genCardImgObj = (openImg:string)=>{
        const loader = new THREE.TextureLoader();
        const materialArray = [
            new THREE.MeshBasicMaterial({color:"black"}),
            new THREE.MeshBasicMaterial({color:"black"}),
            new THREE.MeshBasicMaterial({color:"black"}),
            new THREE.MeshBasicMaterial({color:"black"}),
            new THREE.MeshBasicMaterial({map: loader.load(openImg)}),
            new THREE.MeshBasicMaterial({map: loader.load("cardback.jpg" )}),
        ];
        const cardGeometry = new THREE.BoxGeometry(13.5, 18, 0.01);
        const cardMesh = new THREE.Mesh(cardGeometry,materialArray);

        cardMesh.rotation.x = -Math.PI/2;
        cardMesh.castShadow = true;
        cardMesh.receiveShadow = true;
        return cardMesh;
    };

    const AirmanA = genCardImgObj("Airman.jpg");
    AirmanA.position.set(25,1,25);
    scene.add(AirmanA);

    const board :THREE.Object3D[] = [AirmanA];
    const deck :THREE.Object3D[] = [];
    const hand :THREE.Object3D[] = [];

    for (let i = 0; i < 40; i++) {
        const card = AirmanA.clone();
        card.position.set(75, 1+0.2*(deck.length), 50);
        card.rotation.y = Math.PI;
        deck.push(card);
        scene.add(card);
    };

    const mouse = new THREE.Vector2();
    mainCanv.addEventListener('mousemove', handleMouseMove);
    function handleMouseMove(event) {
        const element = event.currentTarget;
        // canvas要素上のXY座標
        const x = event.clientX - element.offsetLeft;
        const y = event.clientY - element.offsetTop;
        // canvas要素の幅・高さ
        const w = element.offsetWidth;
        const h = element.offsetHeight;
        // -1〜+1の範囲で現在のマウス座標を登録する
        mouse.x = ( x / w ) * 2 - 1;
        mouse.y = -( y / h ) * 2 + 1;
    };
    
    const cardDrag = new DragControls( board, camera, renderer.domElement );
    cardDrag.addEventListener( 'dragstart', function ( event ) { controls.enabled = false; } );
    cardDrag.addEventListener('drag', (event) => {
        event.object.position.y = 1;
    });
    cardDrag.addEventListener( 'dragend', function ( event ) { controls.enabled = true; } );

    const controls = new OrbitControls( camera, renderer.domElement );
    // controls.enabled = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.2;

    const raycaster = new THREE.Raycaster();
    renderer.domElement.addEventListener("click", onclick, true);
    function onclick(event) {
        raycaster.setFromCamera(mouse, camera);
        const boardIntersects = raycaster.intersectObjects(board,true); 
        if (boardIntersects.length > 0) {
            const selectedObject = boardIntersects[0].object;
            flipAnimation(selectedObject);
            console.log(camera.rotation.x)
        };
        const deckIntersects = raycaster.intersectObjects(deck,true); 
        if (deckIntersects.length > 0) {
            drawCard(1);
        };
        const handIntersects = raycaster.intersectObjects(hand,true); 
        if (handIntersects.length > 0) {
            const selectedObject = handIntersects[0].object;
            console.log(selectedObject.rotation.x)
        };
    };

    const flipAnimation = (Obj:THREE.Object3D) => {
        Tween.get(Obj.position)
            .to({y:Obj.position.y+20},250,createjs.Ease.sineIn)
            .to({y:Obj.position.y},250,createjs.Ease.sineOut);
        Tween.get(Obj.rotation)
            .to({y:(-Math.PI-Obj.rotation.y),z:(-Math.PI/2-Obj.rotation.z)},500,createjs.Ease.sineInOut);
        return
    };

    const drawCard = async(count:number)=>{
        return new Promise<void>(async(resolve, reject) => {
            for (let i = 0; i < count ; i++){
                const target = deck.pop();
                hand.push(target);
                console.log("draw");
                console.log(hand);
                await handAdjust();
            };
            resolve();
        });
    };

    const handAdjust =  () => {
        console.log("adjust");
        const leftEndPosition = -( ( (cardSize.x+cardSize.margin)/2 ) * (hand.length-1) );
        const promiseArray = [];
        hand.forEach((card, i, array) => {
            const tweenPromise = (()=> {
                return new Promise((resolve, reject) => {
                    Tween.get(card.rotation)
                        .to({x:-Math.PI/3,y:0},500,createjs.Ease.sineIn);
                    Tween.get(card.position)
                    .to({
                        x:leftEndPosition + (cardSize.x+cardSize.margin)*i,
                        y:15,
                        z:90
                    },250,createjs.Ease.sineInOut)
                    .call(()=>{resolve()});
                });
            })();
            promiseArray.push(tweenPromise);
        });
        return Promise.all(promiseArray);
    };

    tick();
    // 毎フレーム時に実行されるループイベント
    function tick() {
      // レンダリング
      renderer.render(scene, camera);
      requestAnimationFrame(tick);
      controls.update();
    };
};