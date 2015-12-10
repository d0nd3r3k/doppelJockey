/*
 * HTML5 Web Audio API
 */

 // Get signal from microphone
var tracks =[];
var isMobile = !!navigator.userAgent.match(/iphone|android/ig) || false;

if(!isMobile){
// define audio context
var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
var mainVolume = audioCtx.createGain();
mainVolume.connect(audioCtx.destination);

// bufferLoader = new BufferLoader(
//     audioCtx,
//     [
//       'tracks/track1.m4a',
//       'tracks/track2.m4a',
//       'tracks/track3.m4a',
//       'tracks/track4.m4a',
//       'tracks/track5.m4a',
//       'tracks/track6.m4a',
//     ],
//     finishedLoading
// );
//
// bufferLoader.load();
//
// function finishedLoading(bufferList){
//     for(var i=0; i<bufferList.length;i++){
//         tracks[i].source.buffer = bufferList[i];
//     }
//     console.log(bufferList)
//
// }

function summonTrack(filename,x,y,z){
    var track = {};
    track.source = audioCtx.createBufferSource();
    track.volume = audioCtx.createGain();
    track.filename = filename;
    track.isPlaying = false;
    //track.source.loop = true;
    track.source.connect(track.volume);

    track.panner = audioCtx.createPanner();
    track.volume.connect(track.panner);
    track.panner.connect(mainVolume);

    track.panner.setPosition(x,y,z);
    tracks.push(track);
    spawnSphere(12, x,y,z, true);
    return track;
}

function requestTrack(track){

    // Load a sound file using an ArrayBuffer XMLHttpRequest.
    var request = new XMLHttpRequest();
    request.open("GET", track.filename, true);
    request.responseType = "arraybuffer";
    request.onload = function(e) {

      // Create a buffer from the response ArrayBuffer.
      audioCtx.decodeAudioData(this.response, function onSuccess(buffer) {

        track.buffer = buffer;
        console.log("receiving buffer...");
        // Make the sound source use the buffer and start playing it.
        track.source.buffer = track.buffer;
        //track.source.start(audioCtx.currentTime);
      }, function onFailure() {
        alert("Decoding the audio buffer failed");
      });
    };
    request.send();
}

function replaceTrack(track, f){

    if(track.isPlaying)
        track.source.stop();

    track.source = audioCtx.createBufferSource();
    track.buffer = undefined;
    track.filename = f;
    track.isPlaying=false;
    track.source.connect(track.volume);
    requestTrack(track);
}
// Webkit/blink browsers need prefix, Safari won't work without window.
navigator.getUserMedia = navigator.getUserMedia ||
                     navigator.webkitGetUserMedia ||
                     navigator.mozGetUserMedia;

 var analyser = audioCtx.createAnalyser(),
     gainNode = audioCtx.createGain(),
     bufferLength = analyser.frequencyBinCount,
     dataArray = new Uint8Array(bufferLength);


 navigator.getUserMedia (
   {
     audio: true
   },
   function(stream) {

     source = audioCtx.createMediaStreamSource(stream);
     source.connect(analyser);
     gainNode.connect(audioCtx.destination);
     analyser.fftSize = 2048;
   },
   function(err) {
     console.log('The following gUM error occured: ' + err);
   }
 );
}

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
    container = document.getElementById( 'webglviewer' );
	document.body.appendChild( container );

    var debugCanvas = document.createElement( 'canvas' );
	debugCanvas.width = 274;
	debugCanvas.height = 128;
	debugCanvas.style.position = 'absolute';
	debugCanvas.style.bottom = '10px';
	debugCanvas.style.left = '50%';
    debugCanvas.style.marginLeft = '-136px';

	container.appendChild( debugCanvas );

	debugContext = debugCanvas.getContext( '2d' );
	debugContext.setTransform(1,0,0,1,136,64);
	debugContext.strokeStyle = '#FFFFFF';

    //addGUI(guidat);

    //Track sphere
    requestTrack(summonTrack('tracks/track1.m4a',0,12,0));
    requestTrack(summonTrack('tracks/track2.m4a',0,12,127));
    requestTrack(summonTrack('tracks/track6.m4a',0,12,254));
    requestTrack(summonTrack('tracks/track5.m4a',254,12,254));
    requestTrack(summonTrack('tracks/track4.m4a',254,12,127));
    requestTrack(summonTrack('tracks/track3.m4a',254,12,0));

    clock = new THREE.Clock();

    animate();

}

function initWorldMap(){
    //Scenes hemilight - the sky is red inside FL
    //var hemiLight = new THREE.HemisphereLight( 0x9E1A1A, 0x9E1A1A, 1 );
    var hemiLight = new THREE.HemisphereLight( 0x000000, 0x000000, 0.2 );
    hemiLight.position.y = 500;
    scene.add( hemiLight );

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
    requestAnimationFrame(animate);

        if(!isMobile){
            analyser.getByteTimeDomainData(dataArray);
            // Visualize cubes to audio
            var vx =[];
            for(var i=0; i<bufferLength; i++){
                vx.push(v);
                var v = dataArray[i]/128;
                if(vx[i-1] != v){
                    visualizeSingleCube(i, v);
                }
            }
        }
    audioCtx.listener.setPosition(player.position.x, player.position.y, player.position.z);
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
        if(i<=2){
            if(tracks[i].isPlaying)
                drawDebugPlay(sphere, true)
            if(tracks[i].isPlaying == 100)
                drawDebugPlay(sphere, true, true)
        }
        else {
            if(tracks[i].isPlaying)
                drawDebugPlay(sphere, false)
            if(tracks[i].isPlaying == 100)
                drawDebugPlay(sphere, true, true)
        }
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

function drawCenterCross(){
    debugContext.moveTo( -10, 0 );
	debugContext.lineTo( 10, 0 );
	debugContext.moveTo( 0, -10 );
	debugContext.lineTo( 0, 10 );
}

function drawDebugSphere(sphere, color){
    debugContext.beginPath();
    debugContext.rect(-sphere.position.z+122,(sphere.position.x-122)/2.5,10,10);
    debugContext.strokeStyle = color;
    debugContext.closePath();
	debugContext.stroke();
}

function drawDebugPlay(sphere, opp, isPaused){
    if (typeof(isPaused)==='undefined') isPaused = false;
    debugContext.beginPath();
    if(opp)
        debugContext.rect(-sphere.position.z+125,(sphere.position.x-98)/2.5,4,4);
    else
        debugContext.rect(-sphere.position.z+125,(sphere.position.x-132)/2.5,4,4);

    if(isPaused)
        debugContext.strokeStyle = 'blue';
    else
        debugContext.strokeStyle = 'green';

    debugContext.closePath();
	debugContext.stroke();
}

function whichQuad(){
    if((player.position.x <= 127) && (player.position.z >= 0) && (player.position.z <= 127))
        return 0;
    if((player.position.x <= 127) && (player.position.z > 127) && (player.position.z <= 254))
        return 1;
    if((player.position.x > 127) && (player.position.z >= 0) && (player.position.z <= 127))
        return 2;
    if((player.position.x > 127) && (player.position.z >= 127) && (player.position.z <= 254))
        return 3;
}

function visualizeSingleCube(i, v){

    var scale = v+getRandomInt(1,5)/10*guidat.scale;
    var index = i%blocks.length;
    blocks[index].scale.set(scale, scale, scale);

    if(v < 0.8)
        blocks[index].material = materials.basicRed;
    else if ( v > 0.8 && v < 1.05)
        blocks[index].material = materials.basicBlack;
    else
        blocks[index].material = materials.basicWhite;
}

function spawnCube(scale, x, y, z){
    geometries.scale = scale;
    var cube = new THREE.Mesh( geometries.basicCube, materials.basicBlack );
    cube.position.set(x, y, z);
    blocks.push(cube);
    scene.add(cube);
}

function spawnCubismTest(){
    spawnCube(1, 10, 10, 10);
    spawnCube(2, 20, 10, 10);
    spawnCube(4, 10, 20, 10);
    spawnCube(3, 10, 10, 20);
}

function spawnSphere(scale, x, y, z, isTrack){
    var basicSphere = new THREE.SphereGeometry(scale, 32, 32);
    var material;

    if (isTrack)
        material = new THREE.MeshBasicMaterial( { color: 0xfefefe, wireframe:true,transparent: true, opacity: 0.2 } );
    else
        material = new THREE.MeshBasicMaterial( { color: 0xfefefe, wireframe:true,transparent: true, opacity: 0.02 } );

    var s = new THREE.Mesh( basicSphere, material );
    s.position.set(x, y, z);
    scene.add(s);

    if(isTrack)
        spheres.push(s);
}

function animateBlock(time){
    blocks[0].position.set(10, Math.sin(time*0.013)*10+5, 10);
    blocks[1].position.set(20, Math.sin(time*0.01+10)*10+5, 10);
    blocks[2].position.set(40, Math.sin(time*0.003)*10+1, 10);
    blocks[3].position.set(40, Math.sin(time*0.01)*10+3, 20);
}

function scaleBlocks(scale){
    for(var i=0; i<blocks.length; i++){
            blocks[i].scale.set(Math.random()*2*scale, Math.random()*4*scale, Math.random()*2*scale);
    }
}

function turnBlock(){
    blocks[3].rotation.y += 0.1;
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

 function setOrientationControls(e) {
     if (!e.alpha) {
         return;
     }
     controls = new THREE.DeviceOrientationControls(camera, socket, player, true);
     controls.connect();
     controls.update();
     element.addEventListener('click', fullscreen, false);
     window.removeEventListener('deviceorientation', setOrientationControls, true);
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

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
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

/*
 * Web Midi
 */
 var WebMidi = function(midiAccess, portID){
    var port = portID || "-1047472486";
    var output = midiAccess.outputs.get(port);
    this.access = midiAccess || null;
    this.port = port;

    this.playNote= function(note, decay) {
        var noteOnMessage = [144, note[0], 127];
        var noteOffMessage = [128, note[1], 127];
        output.send( noteOnMessage );
        console.log("MIDI OUT: " + noteOnMessage);
        output.send( noteOffMessage, window.performance.now() + decay );
        console.log("MIDI OUT: " + noteOffMessage);
    }

    this.send= function(midiMessage, time) {
        time = time || 0.00;
        output.send( midiMessage , window.performance.now() + time);
        console.log("MIDI OUT: " + midiMessage + ' T:' + time);
    }

    this.listIO = function () {
        for (var entry of midiAccess.inputs) {
            var input = entry[1];
            console.log(input);
        }

        for (var entry of midiAccess.outputs) {
            var output = entry[1];
            console.log(output);
        }
    }

    this.setPort = function(port){
        this.port = port;
    }
    this.getPort = function(){
        console.log(this.port)
    }
}

navigator.requestMIDIAccess().then( function(midiAccess){
    var midi = new WebMidi(midiAccess,"1037096982");
    initMidi(midi);
    startLoggingMIDIInput(midiAccess);

}, function(err){
    console.log( "Failed to get MIDI access - " + msg );
});

// Midi mapped from a Numark MIXTRACK PRO II Dj Controller.
function onMIDIMessage( event ) {
    var action = event.data[1];
    var force = event.data[2];
    var rotX = 0;
    var rotY = 0;
    console.log("a: %s, f: %s",action, force);
    switch (action) {
        case 10:
            player.position.set(player.position.x, player.position.y, 2*force);
            break;
        case 22:
            guidat.scale = force;
            break;
        case 23:
            player.position.set(2*force, player.position.y, player.position.z);
            break;
        case 24:
            if(force<=64){
                rotX++;
            }
            else{
                rotX--;
            }
            for (var i=0; i<spheres.length; i++){
                spheres[i].rotateX(rotX/100);
            }
            break;
        case 25:
            if(force==1){
                rotY++;
            }
            else{
                rotY--;
            }
            for (var i=0; i<spheres.length; i++){
                spheres[i].rotateY(rotY/100%360);
            }
            break;
        case 52:
            if(force==127){
                replaceTrack(tracks[0],'tracks/track6.m4a');

            }
            break;

        // Left Play Button
        case 59:
            if(force==127){
                switch (whichQuad()) {
                    case 0:
                        if(!tracks[1].isPlaying){
                            tracks[1].source.start(audioCtx.currentTime);
                            tracks[1].isPlaying=true;
                        }
                        else{
                            if(tracks[1].isPlaying != 100){
                                pauseTrack(1);
                                tracks[1].isPlaying=100;
                            }
                            else{
                                unpauseTrack(1);
                                tracks[1].isPlaying=true;
                            }
                        }
                        break;
                    case 1:
                        if(!tracks[2].isPlaying){
                            tracks[2].source.start(audioCtx.currentTime);
                            tracks[2].isPlaying=true;
                        }
                        else{
                            if(tracks[2].isPlaying != 100){
                                pauseTrack(2);
                                tracks[2].isPlaying=100;
                            }
                            else{
                                unpauseTrack(2);
                                tracks[2].isPlaying=true;
                            }
                        }
                        break;
                    case 2:
                        if(!tracks[4].isPlaying){
                            tracks[4].source.start(audioCtx.currentTime);
                            tracks[4].isPlaying=true;
                        }
                        else{
                            if(tracks[4].isPlaying != 100){
                                pauseTrack(4);
                                tracks[4].isPlaying=100;
                            }
                            else{
                                unpauseTrack(4);
                                tracks[4].isPlaying=true;
                            }
                        }
                        break;
                    case 3:
                        if(!tracks[3].isPlaying){
                            tracks[3].source.start(audioCtx.currentTime);
                            tracks[3].isPlaying=true;
                        }
                        else{
                            if(tracks[3].isPlaying != 100){
                                pauseTrack(3);
                                tracks[3].isPlaying=100;
                            }
                            else{
                                unpauseTrack(3);
                                tracks[3].isPlaying=true;
                            }
                        }
                        break;
                    default:
                }
            }
            break;
            // Right Play Button
            case 66:
                if(force==127){
                    switch (whichQuad()) {
                        case 0:
                            if(!tracks[0].isPlaying){
                                console.log("Trying to play new song: %s", tracks[0].filename);
                                tracks[0].isPlaying=true;
                                tracks[0].source.start(audioCtx.currentTime);
                            }
                            else{
                                if(tracks[0].isPlaying != 100){
                                    pauseTrack(0);
                                    tracks[0].isPlaying=100;
                                }
                                else{
                                    unpauseTrack(0);
                                    tracks[0].isPlaying=true;
                                }
                            }
                            break;
                        case 1:
                            if(!tracks[1].isPlaying){
                                tracks[1].source.start(audioCtx.currentTime);
                                tracks[1].isPlaying=true;
                            }
                            else{
                                if(tracks[1].isPlaying != 100){
                                    pauseTrack(1);
                                    tracks[1].isPlaying=100;
                                }
                                else{
                                    unpauseTrack(1);
                                    tracks[1].isPlaying=true;
                                }
                            }
                            break;
                        case 2:
                            if(!tracks[5].isPlaying){
                                tracks[5].source.start(audioCtx.currentTime);
                                tracks[5].isPlaying=true;
                            }
                            else{
                                if(tracks[5].isPlaying != 100){
                                    pauseTrack(5);
                                    tracks[5].isPlaying=100;
                                }
                                else{
                                    unpauseTrack(5);
                                    tracks[5].isPlaying=true;
                                }
                            }
                            break;
                        case 3:
                            if(!tracks[4].isPlaying){
                                tracks[4].source.start(audioCtx.currentTime);
                                tracks[4].isPlaying=true;
                            }
                            else{
                                if(tracks[4].isPlaying != 100){
                                    pauseTrack(4);
                                    tracks[4].isPlaying=100;
                                }
                                else{
                                    unpauseTrack(4);
                                    tracks[4].isPlaying=true;
                                }
                            }
                            break;
                        default:
                    }
                }
                break;
    }
}

function logMidiMessage(event){
    var str = "MIDI message received at timestamp " + event.timestamp + "[" + event.data.length + " bytes]: ";
    for (var i=0; i<event.data.length; i++) {
      str += "0x" + event.data[i].toString(16) + " ";
    }
    console.log( str );
}
function startLoggingMIDIInput( midiAccess, indexOfPort ) {
  midiAccess.inputs.forEach( function(entry) {
      entry.onmidimessage = onMIDIMessage;
  });
}

function initMidi(midi){
    midi.listIO();
    midi.getPort();
}
