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
  return (a.x-b.x)*(a.x-b.x) + (a.y-b.y)*(a.y-b.y);
}

function avgKernelDensity(painting){

  function singleKernelDensity(reference, set) {
    var sum = -1;
    for (j=0; j<set.length; j++) {
      sum += Math.exp(-distanceSquared(reference, set[j]) / 2000);
    }
    return sum;
  }

  var total = 0;
  shapes = painting.shapes;
  for (i=0; i<shapes.length; i++) {
    total += singleKernelDensity(shapes[i], shapes);
  }
  avg = total / shapes.length;
  return avg;
}

function Shape(x, y, radius, shape, color) {
  this.x = x;
  this.y = y;
  this.radius = radius;
  this.shape = shape;
  this.color = color;
  this.points = []

  this.clone = function() {
    clone = new Shape(this.x, this.y, this.radius, this.shape, this.color);
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
      pointList = regularPolygon(this.x, this.y, this.shape, this.radius, Math.random()*2*Math.PI);
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
    for (i in this.shapes) {
      var s = this.shapes[i];
      s.draw(ctx);
    }
  }

  this.clone = function(){
    var cloneShapes = [];
    for (i=0; i<this.shapes.length; i++){
      cloneShapes[i] = this.shapes[i].clone();
    }
    clone = new Painting(cloneShapes);
    return clone;
  }
}

function generatePainting(num, width, height, radius, shapesLibrary, colorsLibrary) {
  var shapeList = []
  for (i = 0; i < num; i++) {
    ind = randint(0, 3);
    shp = shapesLibrary[ind];
    clr = colorsLibrary[ind];
    shapeList.push(new Shape(randint(0, width), randint(0, height), radius, shp, clr));
  }
  return shapeList;
}

function spaceFitness(painting){
  shapes = painting.shapes;
  var sum = 0;
  for (i=0; i<shapes.length; i++){
    for (j=i+1; j<shapes.length; j++){
      sum += distanceSquared(shapes[i], shapes[j]);
    }
  }
  numConnections = shapes.length*(shapes.length-1)/2
  var avgDist = sum/numConnections;
  return avgDist;
}

function twiddle(painting, aggressiveness){
  newPainting = painting.clone();
  shapes = newPainting.shapes;
  for (i=0; i<shapes.length; i++){
    //eventually make this Gaussian!
    shp = shapes[i]
    shp.x += (Math.random()-0.5)*aggressiveness*2;
    shp.y += (Math.random()-0.5)*aggressiveness*2;
  }
  newPainting.shapes = shapes;
  return newPainting;
}

function main() {
  var canvas = document.getElementById("a");
  var ctx = canvas.getContext("2d");
  var IMAGE_WIDTH = canvas.width;
  var IMAGE_HEIGHT = canvas.height;
  var NUM_SHAPES = 300;
  var NUM_TRIALS = 100;
  var shapesLibrary = ['circle', 4, 6, 8]
  var colorsLibrary = ['#FF6600', '#DD0000', '#00E3BE', '#6600CC']
  var fitnessArray = [];
  var population = [];
  /**
   * Generate a population of paintings.
   */
  // for (trial=0; trial<NUM_TRIALS; trial++){
  //   var painting = new Painting(generatePainting(NUM_SHAPES, IMAGE_WIDTH, IMAGE_HEIGHT, 30, shapesLibrary, colorsLibrary));
  //   population[trial] = painting;
  //   fitnessArray[trial] = spaceFitness(painting);
  //   if (trial==NUM_TRIALS-1) {
  //     painting.draw(ctx);
  //   }
  // }

  var painting = new Painting(generatePainting(NUM_SHAPES, IMAGE_WIDTH, IMAGE_HEIGHT, 30, shapesLibrary, colorsLibrary));
  painting.draw(ctx);
  for(k=0; k<5000; k++){
    oldShapes = painting.shapes;
    newPainting = twiddle(painting, 10);
    //console.log(newPainting.shapes);
    //console.log(avgKernelDensity(newPainting), avgKernelDensity(painting));
    //console.log(avgKernelDensity(newPainting) < avgKernelDensity(painting));
    if (avgKernelDensity(newPainting) < avgKernelDensity(painting)){
      console.log(k, avgKernelDensity(newPainting));
      painting = newPainting;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      painting.draw(ctx);
    }
  }

  // for (i=0; i<20; i++){
  //   painting = twiddle(painting, 10);
  //   painting.draw(ctx);
  // }
}

main();
