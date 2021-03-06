// TODO:
// 1. Area (done)
// 2. Torus (done, but the density is still calculated as if not a torus)
// 3. Golden ratio ???
// 4. N^2 distances (only really compute N(N+1)/2, mirror lower diagonal !)


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

function scaleFactor(n){
  if (typeof n == 'number'){
    return Math.sqrt(2 * Math.PI / (Math.sin(2 * Math.PI / n) * n));
  } else if (n == 'circle'){
    return 1;
  } else if (typeof n == 'object') {
    var scaleArray = [];
    for (var i=0; i<n.length; i++){
      if (typeof n[i] == 'number'){
        scaleArray[i] = Math.sqrt(2 * Math.PI / (Math.sin(2 * Math.PI / n[i]) * n[i]));
      } else if (n[i] == 'circle'){
        scaleArray[i] = 1;
      }
    }
    return scaleArray;
  }
}

function distanceSquared(a, b) {
  return (a.x-b.x)*(a.x-b.x) + (a.y-b.y)*(a.y-b.y);
}

function Shape(x, y, theta, radius, radScale, shape, color) {
  this.x = x;
  this.y = y;
  this.theta = theta;
  this.radius = radius;
  this.radScale = radScale;
  this.shape = shape;
  this.color = color;
  this.points = []

  this.clone = function() {
    clone = new Shape(this.x, this.y, this.theta, this.radius, this.radScale, this.shape, this.color);
    return clone;
  }

  this.draw = function (ctx) {
    ctx.fillStyle = this.color;
    if (this.shape == 'circle'){
      this.points[0] = this.radius;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, 2*Math.PI);
      ctx.closePath();
      ctx.fill();
    } else if (typeof this.shape == 'number'){
      pointList = regularPolygon(this.x, this.y, this.shape, this.radius * this.radScale, this.theta);
      xlist = pointList[0];
      ylist = pointList[1];
      ctx.beginPath();
      ctx.moveTo(xlist[0], ylist[0]);
      this.points[0] = [xlist[0], ylist[0]];
      for (i = 1; i<this.shape; i++){
        ctx.lineTo(xlist[i], ylist[i]);
        this.points[i] = [xlist[i], ylist[i]];
      }
      ctx.fill();
    }
  }
}

function Painting(shapes){
  this.shapes = shapes;
  this.draw = function(ctx){
    for (var i=0; i<this.shapes.length; i++) {
      var s = this.shapes[i];
      s.draw(ctx);
    }
  }

  this.getSubset = function(shape){
    subset = [];
    for (var i=0; i<this.shapes.length; i++){
      if (this.shapes[i].shape == shape){
        subset.push(this.shapes[i].clone());
      }
    }
    return subset;
    console.log(subset);
  }

  this.clone = function(){
    var cloneShapes = [];
    for (var i=0; i<this.shapes.length; i++){
      cloneShapes[i] = this.shapes[i].clone();
    }
    clone = new Painting(cloneShapes);
    return clone;
  }

  this.avgKernelError = function(shape){

    // Pick a single reference shape, and calculates local density wrpt set
    function singleKernelError(reference, set) {
      var sum = -1;
      for (j=0; j<set.length; j++) {
        sum += Math.exp(-distanceSquared(reference, set[j]) / 1000);
      }
      return sum;
    }

    var total = 0;

    if (shape == 'ALL'){
      shapes = this.shapes;
    } else {
      shapes = this.getSubset(shape);
    }
    for (i=0; i<shapes.length; i++) {
      total += singleKernelError(shapes[i], shapes);
    }
    avg = total / shapes.length;
    return avg;
  }

  // colorRepulsion can be negative -> attraction
  this.targetError = function(shapesLibrary, colorRepulsion){
    var error = 0;
    error += this.avgKernelError('ALL');
    for (var i=0; i<shapesLibrary.length; i++){
      error += colorRepulsion * this.avgKernelError(shapesLibrary[i]);
    }
    return error;
  }

  this.jiggleRandomShape = function(aggressiveness) {
    var i = randint(0, this.shapes.length-1);
    // TODO(thomas): eventually make this Gaussian!
    shp = this.shapes[i];
    var xShift = (Math.random()-0.5)*aggressiveness*2;
    var yShift = (Math.random()-0.5)*aggressiveness*2;
    var newX = shp.x + xShift;
    var newY = shp.y + yShift;
    if (CANVAS_TYPE == 'BORDERED'){
      if (newX < BORDER){
        shp.x = BORDER;
      } else if (newX > globals.canvas.width - BORDER){
        shp.x = globals.canvas.width - BORDER;
      } else {
        shp.x += xShift;
      }
      if (newY < BORDER){
        shp.y = BORDER;
      } else if (newY > globals.canvas.height - BORDER){
        shp.y = globals.canvas.height - BORDER;
      } else {
        shp.y += yShift;
      }
    }
    else if (CANVAS_TYPE == 'TOROIDAL'){
      if (newX < 0){
        shp.x = newX + globals.canvas.width;
      } else if (newX > globals.canvas.width){
        shp.x = newX - globals.canvas.width;
      } else{
        shp.x += xShift;
      }
      if (newY < 0){
        shp.y = newY + globals.canvas.height;
      } else if (newY > globals.canvas.height){
        shp.y = newY - globals.canvas.height;
      } else{
        shp.y += yShift;
      }
    }
  }

  this.flipShapes = function (i, j){
    iShape = this.shapes[i].shape;
    iColor = this.shapes[i].color;
    iScale = this.shapes[i].radScale;
    this.shapes[i].shape = this.shapes[j].shape;
    this.shapes[i].color = this.shapes[j].color;
    this.shapes[i].radScale = this.shapes[j].radScale;
    this.shapes[j].shape = iShape;
    this.shapes[j].color = iColor;
    this.shapes[j].radScale = iScale;
  }

}

function generatePainting(num, width, height, radius, SHAPES_LIBRARY, colorsLibrary) {
  var shapeList = []
  for (i = 0; i < num; i++) {
    ind = randint(0, 3);
    shp = SHAPES_LIBRARY[ind];
    clr = colorsLibrary[ind];
    radScale = SCALE_ARRAY[ind];
    shapeList.push(new Shape(randint(BORDER, width - BORDER), randint(BORDER, height - BORDER),
        Math.random()*2*Math.PI, radius, radScale, shp, clr));
  }
  return new Painting(shapeList);
}

function twiddlePositions(painting, aggressiveness){
  newPainting = painting.clone();
  newPainting.jiggleRandomShape(aggressiveness);
  return newPainting;
}

function twiddleShapes(painting){
  newPainting = painting.clone();
  var i  = randint(0, newPainting.shapes.length-1);
  var j  = randint(0, newPainting.shapes.length-1);
  newPainting.flipShapes(i, j);
  return newPainting;
}


var NUM_SHAPES = 250;
var NUM_TRIALS = 100;
var BETA = 5000;
var RADIUS = 18;
var BORDER = 1.5 * RADIUS;
var JUMP_PROBABILITY = .2;
var FLIP_PROBABILITY = .5;
var COLOR_REPULSION = 5;
var SHAPES_LIBRARY = ['circle', 4, 5, 6];
var CANVAS_TYPE = 'TOROIDAL';
var SCALE_ARRAY = scaleFactor(SHAPES_LIBRARY);
console.log(SHAPES_LIBRARY);
console.log(SCALE_ARRAY);

function init() {
  var canvas = document.getElementById("canvas");
  var ctx = canvas.getContext("2d");
  // var colorsLibrary = ['#FF0000', '#0000FF', '#000000', '#FFFF00'];
  var colorsLibrary = ['#D5430A', '#8A130B', '#284D1A', '#183964'];
  // var colorsLibrary = ['#FF6600', '#DD0000', '#00E3BE', '#6600CC'];
  var fitnessArray = [];
  var population = [];
  var painting = generatePainting(NUM_SHAPES, canvas.width, canvas.height,
    RADIUS, SHAPES_LIBRARY, colorsLibrary);
  var initialError = painting.targetError(SHAPES_LIBRARY, COLOR_REPULSION);
  timer1 = setInterval(doManyIterations, 1);
  timer2 = setInterval(showProgress, 500);
  painting.draw(ctx);
  return {canvas:canvas, ctx:ctx, painting:painting, currentError:initialError};
}

var globals = init();

function doIteration(){
  pick = Math.random();
  if (pick <= FLIP_PROBABILITY) {
    newPainting = twiddleShapes(globals.painting);
  } else if (pick <= JUMP_PROBABILITY + FLIP_PROBABILITY) {
    newPainting = twiddlePositions(globals.painting, 100);
  } else {
    newPainting = twiddlePositions(globals.painting, 3);
  }
  newError = newPainting.targetError(SHAPES_LIBRARY, COLOR_REPULSION);
  if (newError <= globals.currentError){
    globals.painting = newPainting;
    globals.currentError = newError;
    //console.log('ACCEPTED', newError);
  } else {
    acceptanceRatio = Math.exp(BETA * (globals.currentError-newError));
    //console.log(acceptanceRatio);
    test = Math.random();
    if (test < acceptanceRatio){
      globals.painting = newPainting;
      globals.currentError = newError;
    }
  }
}

function doManyIterations(){
  for (var i=0; i<10; i++){
    doIteration();
  }
}

function showProgress(){
    globals.ctx.clearRect(0, 0, globals.canvas.width, globals.canvas.height);
    globals.painting.draw(globals.ctx);
  }
