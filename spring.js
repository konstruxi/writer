
Spring = function(tension, friction) {
  if (tension == null) {
    tension = 40;
  }
  if (friction == null) {
    friction = 7;
  }
  var range = [0, 1, null, 1, 0, 0, 0, 0, 0, 0, 0, 0, this.getTension(tension), this.getFriction(friction), 0, 0];
  range.compute = this.compute;
  range.valueOf = this.valueOf;
  range.complete = this.complete;
  range.clean = this.clean;
  return range;
}

Spring.prototype.valueOf = function() {
  var end, start, value;
  if ((value = this[2]) != null) {
    start = this[0];
    end = this[1];
    return value * ((end - start) || 1) + start;
  }
};

Spring.prototype.getTension = function(value) {
  return (value - 30.0) * 3.62 + 194.0;
};

Spring.prototype.getFriction = function(value) {
  return (value - 8.0) * 3.0 + 25.0;
};

Spring.prototype.compute = function(now, from) {
  var Aa, Av, Ba, Bv, Ca, Cv, Da, Dv, HALF, Pp, Pv, STEP, Tp, Tv, diff, dvdt, dxdt, end, friction, goal, interpolation, old, position, ref, start, tension, velocity;
  start = this[0] || 0;
  end = this[1] || 0;
  goal = (ref = this[3]) != null ? ref : 1;
  from = this[14] || from;
  this[5] = Math.min(Spring.prototype.MAX, this[5] + (now - from) / 1000);
  tension = this[12];
  friction = this[13];
  velocity = this[6];
  position = old = this[2];
  Tv = this[8];
  Tp = this[9];
  Pv = this[10];
  Pp = this[11];
  STEP = Spring.prototype.STEP;
  HALF = Spring.prototype.HALF;
  while (this[5] >= STEP) {
    this[5] -= STEP;
    if (this[5] < STEP) {
      this[10] = velocity;
      this[11] = position;
    }
    Av = velocity;
    Aa = (tension * (goal - Tp)) - friction * velocity;
    Tp = position + Av * HALF;
    Tv = velocity + Aa * HALF;
    Bv = Tv;
    Ba = (tension * (goal - Tp)) - friction * Tv;
    Tp = position + Bv * HALF;
    Tv = velocity + Ba * HALF;
    Cv = Tv;
    Ca = (tension * (goal - Tp)) - friction * Tv;
    Tp = position + Cv * HALF;
    Tv = velocity + Ca * HALF;
    Dv = Tv;
    Da = (tension * (goal - Tp)) - friction * Tv;
    dxdt = (Av + 2 * (Bv + Cv) + Dv) / 6;
    dvdt = (Aa + 2 * (Ba + Ca) + Da) / 6;
    position += dxdt * STEP;
    velocity += dvdt * STEP;
  }
  if (interpolation = this[5] / STEP) {
    position = position * interpolation + this[10] * (1 - interpolation);
    velocity = velocity * interpolation + this[11] * (1 - interpolation);
  }
  this[6] = velocity;
  this[8] = Tv;
  this[9] = Tp;
  this[14] = now;
  this[2] = position;
  diff = position - old;
  if (Math.abs(diff + this[15]) > Spring.prototype.DISPLACEMENT_THRESHOLD) {
    this[7] = 1;
    this[15] = 0;
    return position;
  } else {
    this[15] += diff;
    if (this[7] > 0 && Math.abs(this[6]) < Spring.prototype.REST_THRESHOLD) {
      this.clean();
      this[7] = -1;
      if (position !== goal) {
        return goal;
      }
    }
  }
};

Spring.prototype.clean = function() {
  var i, j, k, results;
  this[15] = 0;
  this[14] = 0;
  for (i = j = 4; j < 7; i = ++j) {
    this[i] = 0;
  }
  results = [];
  for (i = k = 8; k < 12; i = ++k) {
    this[i] = 0;
  }
  return results;
};

Spring.prototype.complete = function(value) {
  if (this[7] && Math.abs(this[6]) < Spring.prototype.REST_THRESHOLD) {
    this[7] = 0;
    return true;
  } else if (this[2] === this[3] && Math.abs(this[6]) < Spring.prototype.REST_THRESHOLD) {
    return true;
  }
};

Spring.prototype.STEP = 0.001;

Spring.prototype.HALF = 0.0005;

Spring.prototype.MAX = 0.064;

Spring.prototype.DISPLACEMENT_THRESHOLD = 0.1;

Spring.prototype.REST_THRESHOLD = 0.1;
