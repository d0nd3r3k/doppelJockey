 // Get signal from microphone
var tracks =[];
var isMobile = !!navigator.userAgent.match(/iphone|android/ig) || false;

/*
 * WebGl Three.js code
 */

var scene,
camera,
debugCamera,
renderer,
element,
container,
effect,
fps,
controls,
player,
mapCube,
mapTexture,
cubeMaterial,
clock,
container,
hemiLight,
guidat;
var debugContext;
var blocks=[];
var spheres=[];
var debugSpheres=[];
var sHost = window.location.origin;
var socket = io.connect(sHost);
var materials = (function(){
    var m = {};
    m.basicBlack = new THREE.MeshBasicMaterial( { color: 0x000000, transparent: true, opacity: 0.1 } );
    m.basicGreen = new THREE.MeshBasicMaterial( { color: 0x4A8C66 } );
    m.basicRed = new THREE.MeshBasicMaterial( { color: 0x9E1A1A } );
    m.basicWhite = new THREE.MeshBasicMaterial( { color: 0xfefefe } );
    m.lambert = new THREE.MeshLambertMaterial();
    m.cubeMaterial = new THREE.MeshLambertMaterial();
    return m;
})();

var geometries = (function(){
    var g = {};
    g.scale = 1;
    g.playerGeometry = new THREE.BoxGeometry(4, 4, 4);
    g.basicCube = new THREE.BoxGeometry(g.scale, g.scale, g.scale);
    g.basicSphere = new THREE.SphereGeometry(g.scale, g.scale, g.scale);
    g.octahedron = new THREE.OctahedronGeometry(g.scale);
    g.ring = new THREE.RingGeometry(g.scale, 5*g.scale, 16*g.scale);
    g.tork = new THREE.TorusKnotGeometry(getRandomInt(3,4)*g.scale, getRandomInt(1,3)*g.scale,100*g.scale,getRandomInt(10,16)*g.scale);
    g.iso = new THREE.IcosahedronGeometry(g.scale);
    return g;
})();

//Before the BIGBANG
init();
//After the BIGBANG

/*
 * WebSockets Socket.io client code
 */

socket.on('connect', function(){
    if(guidat)
        socket.emit('control', guidat);
});

socket.on('apply', function (data) {
    //Add testing controls handled by dat gui
    guidat.scale = data;
});

socket.on('movePlayer', function(data){
        if(data.u && controls)
            player.translateZ( -data.u);
        else if(data.b && controls)
            player.translateZ(data.b);
        else if(data.l && controls)
            player.translateX(-data.l);
        else if(data.r && controls)
            player.translateX(data.r);
});

/*
 * Three.js
 */

function init() {
    scene = new THREE.Scene();

    //Camera
    camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 1, 5000);
    camera.target = new THREE.Vector3( 0, 150, 0 );
    camera.position.set(0, 10, 0);

    //Playa' please!
    player = new THREE.Mesh( geometries.playerGeometry, materials.basicBlack );
    player.position.set(0,10,0);
    player.add(camera);
    scene.add(player);

    //FPS Control
    if(!controls){
        fps = new THREE.FirstPersonControls(player, socket, camera);
        fps.mouseEnabled = false;
    }

    renderer = new THREE.WebGLRenderer();
    element = renderer.domElement;
    container = document.getElementById('webglviewer');
    container.appendChild(element);

    //Stereo effect
    effect = new THREE.StereoEffect(renderer);

    //Device events
    window.addEventListener('deviceorientation', setOrientationControls, true);

    //Display fps
    stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.zIndex = 100;
    stats.domElement.style.bottom = '0px';
    stats.domElement.style.right = '0px';
    container.appendChild( stats.domElement );

    //Worlds elements
    initWorldMap();

    //GUI Control
    guidat = new function(){
        this.scale = 1;
        this.stereo = true;
        //Add more control variables
    }

    //Map
	document.body.appendChild( container );

    var debugCanvas = document.createElement( 'canvas' );
    //debugCanvas.width = 274;
	//debugCanvas.height = 128;
    debugCanvas.width = 274;
    debugCanvas.height = 128;
	debugCanvas.style.position = 'absolute';
	debugCanvas.style.bottom = '10px';
	debugCanvas.style.left = '50%';
    debugCanvas.style.marginLeft = '-136px';
    debugCanvas.style.visibility = 'hidden';

	container.appendChild( debugCanvas );

	debugContext = debugCanvas.getContext( '2d' );
	debugContext.setTransform(1,0,0,1,136,64);
	debugContext.strokeStyle = '#FFFFFF';

    //Cube for drawing canvas
    mapTexture = new THREE.Texture(debugCanvas);
    mapTexture.minFilter = THREE.LinearFilter;
    cubeMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, map: mapTexture });

    mapCube = new THREE.Mesh(new THREE.BoxGeometry(12, 12, 12), cubeMaterial);
    mapCube.scale.set(1, 0.5, 0.5);
    mapCube.position.set(0, 7, -15);
    player.add(mapCube);

    //addGUI(guidat);

    //Track sphere
    spawnSphere(12,0,12,0,true);
    spawnSphere(12,0,12,127,true);
    spawnSphere(12,0,12,254,true);
    spawnSphere(12,254,12,254,true);
    spawnSphere(12,254,12,127,true);
    spawnSphere(12,254,12,0,true);

    clock = new THREE.Clock();

    animate();

}

function initWorldMap(){
    //Scenes hemilight - the sky is red inside FL
    //var hemiLight = new THREE.HemisphereLight( 0x9E1A1A, 0x9E1A1A, 1 );
    var hemiLight = new THREE.HemisphereLight( 0x000000, 0x000000, 0.2 );
    hemiLight.position.y = 500;
    scene.add( hemiLight );
    //this.scene.add(new THREE.AmbientLight());

    //Mighty Skydome
    var vertexShader = document.getElementById( 'vertexShader' ).textContent;
    var fragmentShader = document.getElementById( 'fragmentShader' ).textContent;
    var uniforms = {
        topColor: 	 { type: "c", value: new THREE.Color( 0x000000 ) },
        bottomColor: { type: "c", value: new THREE.Color( 0x000000 ) },
        offset:		 { type: "f", value: 400 },
        exponent:	 { type: "f", value: 0.6 }
    };
    uniforms.topColor.value.copy( hemiLight.color );

    var skyGeo = new THREE.SphereGeometry( 1000, 32, 15 );
    var skyMat = new THREE.ShaderMaterial( {
        uniforms: uniforms,
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        side: THREE.BackSide
    } );

    var sky = new THREE.Mesh( skyGeo, skyMat );
    scene.add( sky );

    //Infinite grid
    var floorTexture = THREE.ImageUtils.loadTexture('textures/grid.jpg');
    floorTexture.wrapS = THREE.RepeatWrapping;
    floorTexture.wrapT = THREE.RepeatWrapping;
    floorTexture.repeat = new THREE.Vector2(50, 50);
    floorTexture.anisotropy = renderer.getMaxAnisotropy();

    var floorMaterial = new THREE.MeshPhongMaterial({
        color: 0xffffff,
        specular: 0xffffff,
        shininess: 1,
        shading: THREE.FlatShading,
        map: floorTexture
    });

    var geometry = new THREE.PlaneBufferGeometry(5000, 5000);

    var floor = new THREE.Mesh(geometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    for(var i=0; i<2048; i++)
        spawnCube(getRandomInt(1,10),getRandomInt(-1000,1000),getRandomInt(120,600),getRandomInt(-1000,1000));
    for(var i=0; i<24; i++)
        spawnSphere(getRandomInt(6,16),getRandomInt(-1000,1000),getRandomInt(500,1000),getRandomInt(-1000,1000), false);
}

/*
 * Animate and Render
 */

function animate() {
    var time = Date.now();

    //animateBlock(time);
    cubeMaterial.map.needsUpdate = true;
    requestAnimationFrame(animate);
    //track.panner.setPosition(player.position.x, player.position.y, player.position.z);

    update(clock.getDelta());
    render(clock.getDelta());
}

function update(dt) {
    if(stats) stats.update();
    resize();
    camera.updateProjectionMatrix();
    if(controls)
        controls.update(dt);
    else
        fps.update(dt);

    // Canvas 2D Map
    debugContext.clearRect( -136, -64, 274, 128 );

	debugContext.beginPath();

	// camera
	debugContext.rect( -player.position.z+125, (player.position.x-114)/2.5, 4, 4 );

	debugContext.closePath();
	debugContext.stroke();

    // Tracks
    for (var i=0; i<spheres.length; i++){
        var sphere = spheres[i];
        drawDebugSphere(sphere, 'white');
    }

    switch (whichQuad()) {
        case 0:
            drawDebugSphere(spheres[0], 'red');
            drawDebugSphere(spheres[1], 'red');
            break;
        case 1:
            drawDebugSphere(spheres[1], 'red');
            drawDebugSphere(spheres[2], 'red');
            break;
        case 2:
            drawDebugSphere(spheres[4], 'red');
            drawDebugSphere(spheres[5], 'red');
            break;
        case 3:
            drawDebugSphere(spheres[3], 'red');
            drawDebugSphere(spheres[4], 'red');
            break;
        default:
    }
}

function render(dt) {
    if(isMobile || guidat.stereo)
        effect.render(scene, camera);
    else
        renderer.render(scene, camera);
}

/*
 * Helper Functions
 */

function pauseTrack(id){
    tracks[id].source.disconnect();
}

function unpauseTrack(id){
    tracks[id].source.connect(tracks[id].volume)
}


/*
 * Util functions
 */

 function sendMessage(data){
     console.log(data)
     Object.keys(data).forEach(function(key) {
         data[key] = Math.round(data[key]*10)/10;
     });
     socket.emit('update', data);
 }

 function addGUI(datObj){
     var gui = new dat.GUI();
     var customContainer = document.getElementById('guiDat');
     customContainer.appendChild(gui.domElement);
     gui.add(datObj, 'stereo', true);
     gui.add(datObj, 'scale', 0.1, 40).onChange(function(v){
         sendMessage(v);
     });
 }

 function resize() {
     var width = container.offsetWidth;
     var height = container.offsetHeight;
     camera.aspect = width / height;
     camera.updateProjectionMatrix();
     renderer.setSize(width, height);
     if(effect)
         effect.setSize(width, height);
 }

function fullscreen() {
    if (container.requestFullscreen) {
        container.requestFullscreen();
    } else if (container.msRequestFullscreen) {
        container.msRequestFullscreen();
    } else if (container.mozRequestFullScreen) {
        container.mozRequestFullScreen();
    } else if (container.webkitRequestFullscreen) {
        container.webkitRequestFullscreen();
    }
}

function getURL(url, callback) {
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState == 4) {
            if (xmlhttp.status == 200)
                callback(JSON.parse(xmlhttp.responseText));
            else
                console.log('We had an error, status code: ', xmlhttp.status);
        }
    }
    xmlhttp.open('GET', url, true);
    xmlhttp.send();
}

function depCamera(){
    controls = new THREE.OrbitControls(camera, element);
    controls.target.set(
      camera.position.x + 0.15,
      camera.position.y,
      camera.position.z
    );
    controls.noPan = true;
    controls.noZoom = true;
}

function sendConsole(val){
    eval(val);
}

/*
 * Keyboard control
 */

window.addEventListener('keydown', function(e) {
        switch(e.keyCode) {
            case 32:
                if(fps) fps.mouseEnabled = !fps.mouseEnabled;
            break;
        }
});
