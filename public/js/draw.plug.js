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

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
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
