var a_canvas = document.getElementById("a");
var ctx = a_canvas.getContext("2d");
var imagewidth = a_canvas.width;
var imageheight = a_canvas.height;
var numshapes = 300;
var shapesLibrary = ['circle', 4, 6, 8]
var colorsLibrary = ['#FF6600', '#DD0000', '#00E3BE', '#6600CC']

function randint(low, high) {
  return Math.floor(Math.random() * (high - low + 1)) + low;
}

function regularPolygon(x, y, n, rad, rot) {
  var xlist = [];
  var ylist = [];
  for (i = 0; i < n; i++){
    xlist[i] = x + rad * Math.cos(2*Math.PI*i/n - rot);
    ylist[i] = y + rad * Math.sin(2*Math.PI*i/n - rot);
  }
  return [xlist, ylist];
}

function distanceSquared(a, b) {
  return Math.pow((a.x - b.x), 2) + Math.pow((a.y - b.y), 2)
}

function shapeObject(x, y, radius, shape, color) {
  this.x = x;
  this.y = y;
  this.radius = radius;
  this.shape = shape;
  this.color = color;
  this.points = []
}

//generate the shape objects
var shapes = [];
for (i = 0; i < numshapes; i++) {
  ind = randint(0, 3);
  shp = shapesLibrary[ind];
  clr = colorsLibrary[ind];
  shapes.push(new shapeObject(randint(0, imagewidth), randint(0, imageheight), 30, shp, clr));
}

//draw the shapes
for (i in shapes){
  var s = shapes[i];
  ctx.fillStyle = s.color;
  if (s.shape == 'circle'){
    s.points[0] = s.radius;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.radius, 0, 2*Math.PI);
    ctx.closePath();
    ctx.fill();
  } else if (typeof s.shape == 'number'){
    pointList = regularPolygon(s.x, s.y, s.shape, s.radius, Math.random()*2*Math.PI);
    xlist = pointList[0];
    ylist = pointList[1];
    ctx.beginPath();
    ctx.moveTo(xlist[0], ylist[0]);
    s.points[0] = [xlist[0], ylist[0]];
    for (i = 1; i<s.shape; i++){
      ctx.lineTo(xlist[i], ylist[i]);
      s.points[i] = [xlist[i], ylist[i]];
    }
    ctx.fill();
  }
  //console.log(s.points);
}

function spaceFitness(set){
  var sum = 0;
  for (i=0; i<set.length; i++){
    for (j=i+1; j<set.length; j++){
      sum += distanceSquared(set[i], set[j]);
    }
  }
  numConnections = set.length*(set.length-1)/2
  console.log(numConnections);
  var avgDist = sum/numConnections;
  return avgDist;
}

console.log(spaceFitness(shapes))
