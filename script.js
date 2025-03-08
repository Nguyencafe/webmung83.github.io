/* -------------------------------
   Hiệu ứng trái tim (Particle Effect)
------------------------------- */
var heartScale = 1.2;
var settings = {
  particles: {
    length: 300,
    duration: 2,
    velocity: 80,
    effect: -0.75,
    size: 25,
  },
};

(function(){
  var lastTime = 0, vendors = ['ms', 'moz', 'webkit', 'o'];
  for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x){
    window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
    window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
  }
  if (!window.requestAnimationFrame)
      window.requestAnimationFrame = function(callback) {
          var currTime = new Date().getTime();
          var timeToCall = Math.max(0, 16 - (currTime - lastTime));
          var id = window.setTimeout(function() { callback(currTime + timeToCall); }, timeToCall);
          lastTime = currTime + timeToCall;
          return id;
      };
  if (!window.cancelAnimationFrame)
      window.cancelAnimationFrame = function(id) { clearTimeout(id); };
}());

var Point = function(x, y) {
  this.x = (typeof x !== 'undefined') ? x : 0;
  this.y = (typeof y !== 'undefined') ? y : 0;
};
Point.prototype.clone = function() { return new Point(this.x, this.y); };
Point.prototype.length = function(length) {
  if (typeof length === 'undefined')
      return Math.sqrt(this.x * this.x + this.y * this.y);
  this.normalize();
  this.x *= length;
  this.y *= length;
  return this;
};
Point.prototype.normalize = function() {
  var len = this.length();
  this.x /= len;
  this.y /= len;
  return this;
};

var Particle = function() {
  this.position = new Point();
  this.velocity = new Point();
  this.acceleration = new Point();
  this.age = 0;
};
Particle.prototype.initialize = function(x, y, dx, dy) {
  this.position.x = x;
  this.position.y = y;
  this.velocity.x = dx;
  this.velocity.y = dy;
  this.acceleration.x = dx * settings.particles.effect;
  this.acceleration.y = dy * settings.particles.effect;
  this.age = 0;
};
Particle.prototype.update = function(deltaTime) {
  this.position.x += this.velocity.x * deltaTime;
  this.position.y += this.velocity.y * deltaTime;
  this.velocity.x += this.acceleration.x * deltaTime;
  this.velocity.y += this.acceleration.y * deltaTime;
  this.age += deltaTime;
};
Particle.prototype.draw = function(context, image) {
  function ease(t) { return (--t) * t * t + 1; }
  var size = image.width * ease(this.age / settings.particles.duration);
  context.globalAlpha = 1 - this.age / settings.particles.duration;
  context.drawImage(image, this.position.x - size / 2, this.position.y - size / 2, size, size);
};

var ParticlePool = function(length) {
  this.particles = new Array(length);
  for (var i = 0; i < this.particles.length; i++)
      this.particles[i] = new Particle();
  this.firstActive = 0;
  this.firstFree = 0;
  this.duration = settings.particles.duration;
};
ParticlePool.prototype.add = function(x, y, dx, dy) {
  this.particles[this.firstFree].initialize(x, y, dx, dy);
  this.firstFree++;
  if (this.firstFree == this.particles.length)
      this.firstFree = 0;
  if (this.firstActive == this.firstFree)
      this.firstActive++;
  if (this.firstActive == this.particles.length)
      this.firstActive = 0;
};
ParticlePool.prototype.update = function(deltaTime) {
  var i;
  if (this.firstActive < this.firstFree) {
      for (i = this.firstActive; i < this.firstFree; i++)
          this.particles[i].update(deltaTime);
  }
  if (this.firstFree < this.firstActive) {
      for (i = this.firstActive; i < this.particles.length; i++)
          this.particles[i].update(deltaTime);
      for (i = 0; i < this.firstFree; i++)
          this.particles[i].update(deltaTime);
  }
  while (this.particles[this.firstActive].age >= this.duration && this.firstActive != this.firstFree) {
      this.firstActive++;
      if (this.firstActive == this.particles.length)
          this.firstActive = 0;
  }
};
ParticlePool.prototype.draw = function(context, image) {
  var i;
  if (this.firstActive < this.firstFree) {
      for (i = this.firstActive; i < this.firstFree; i++)
          this.particles[i].draw(context, image);
  }
  if (this.firstFree < this.firstActive) {
      for (i = this.firstActive; i < this.particles.length; i++)
          this.particles[i].draw(context, image);
      for (i = 0; i < this.firstFree; i++)
          this.particles[i].draw(context, image);
  }
};

(function(canvas) {
  var context = canvas.getContext('2d'),
      particles = new ParticlePool(settings.particles.length),
      particleRate = settings.particles.length / settings.particles.duration,
      time;
  
  function pointOnHeart(t) {
      return new Point(
          160 * heartScale * Math.pow(Math.sin(t), 3),
          (130 * Math.cos(t) - 50 * Math.cos(2*t) - 20 * Math.cos(3*t) - 10 * Math.cos(4*t) + 25) * heartScale
      );
  }
  
  var image = (function() {
      var tempCanvas = document.createElement('canvas'),
          tempContext = tempCanvas.getContext('2d');
      tempCanvas.width = settings.particles.size;
      tempCanvas.height = settings.particles.size;
      function to(t) {
          var point = pointOnHeart(t);
          point.x = settings.particles.size / 2 + point.x * settings.particles.size / 350;
          point.y = settings.particles.size / 2 - point.y * settings.particles.size / 350;
          return point;
      }
      tempContext.beginPath();
      var t = -Math.PI;
      var point = to(t);
      tempContext.moveTo(point.x, point.y);
      while (t < Math.PI) {
          t += 0.01;
          point = to(t);
          tempContext.lineTo(point.x, point.y);
      }
      tempContext.closePath();
      // Đổi màu trái tim particle sang màu đỏ
      tempContext.fillStyle = '#ff0000';
      tempContext.fill();
      var img = new Image();
      img.src = tempCanvas.toDataURL();
      return img;
  })();
  
  function render() {
      requestAnimationFrame(render);
      var newTime = new Date().getTime() / 1000,
          deltaTime = newTime - (time || newTime);
      time = newTime;
      context.clearRect(0, 0, canvas.width, canvas.height);
      var amount = particleRate * deltaTime;
      for (var i = 0; i < amount; i++) {
          var pos = pointOnHeart(Math.PI - 2 * Math.PI * Math.random());
          var dir = pos.clone().length(settings.particles.velocity);
          particles.add(canvas.width / 2 + pos.x, canvas.height / 2 - pos.y, dir.x, -dir.y);
      }
      particles.update(deltaTime);
      particles.draw(context, image);
  }
  
  function onResize() {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
  }
  
  window.addEventListener('resize', onResize);
  setTimeout(function() {
      onResize();
      render();
  }, 10);
})(document.getElementById('pinkboard'));

// ================ Xử lý nhạc ================
document.getElementById("playMusicButton").addEventListener("click", function() {
    const audio = document.getElementById("audioPlayer");
    if (audio.paused) {
      audio.play()
        .then(() => {
          this.innerHTML = "⏸ Tạm dừng";
        })
        .catch(error => {
          console.log("Cần tương tác trước khi phát nhạc");
          alert("Vui lòng click một lần nữa để phát nhạc!");
        });
    } else {
      audio.pause();
      this.innerHTML = "🎵 Phát nhạc";
    }
  });
// ================ Chuyển trang mượt mà ================
document.getElementById("nextButton").addEventListener("click", function() {
    document.getElementById("mainContent").style.opacity = "0";
    document.getElementById("mainContent").style.transform = "translate(-50%, -50%) translateY(50px)";
    
    setTimeout(() => {
      document.getElementById("mainContent").style.display = "none";
      document.getElementById("nextContent").style.display = "flex";
    }, 500);
  });
/* -------------------------------
   Hiệu ứng tuyết rơi (Snowfall)
------------------------------- */
(function(){
  var snowCanvas = document.getElementById('snowCanvas'),
      ctx = snowCanvas.getContext('2d'),
      width, height,
      snowflakes = [],
      maxFlakes = 100;
      
  function init() {
      resize();
      for(var i=0; i<maxFlakes; i++){
          snowflakes.push({
              x: Math.random()*width,
              y: Math.random()*height,
              radius: Math.random()*3+1,
              speed: Math.random()*1+0.5,
              wind: Math.random()*0.5-0.25
          });
      }
      requestAnimationFrame(update);
  }
  function resize() {
      width = snowCanvas.width = window.innerWidth;
      height = snowCanvas.height = window.innerHeight;
  }
  function update() {
      ctx.clearRect(0,0,width,height);
      for(var i=0; i<snowflakes.length; i++){
          var flake = snowflakes[i];
          flake.y += flake.speed;
          flake.x += flake.wind;
          if(flake.y > height){
              flake.y = -flake.radius;
          }
          if(flake.x > width){
              flake.x = 0;
          }
          if(flake.x < 0){
              flake.x = width;
          }
          ctx.beginPath();
          ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
          ctx.arc(flake.x, flake.y, flake.radius, 0, Math.PI*2);
          ctx.fill();
      }
      requestAnimationFrame(update);
  }
  window.addEventListener('resize', resize);
  init();
})();

/* -------------------------------
   Hiệu ứng trái tim rơi (Falling Hearts)
------------------------------- */
(function(){
  var heartCanvas = document.getElementById('heartCanvas'),
      ctx = heartCanvas.getContext('2d'),
      width, height,
      heartsArr = [],
      maxHearts = 50;
  
  function initHearts() {
      resizeHearts();
      for(var i = 0; i < maxHearts; i++){
          heartsArr.push({
              x: Math.random() * width,
              y: Math.random() * height,
              size: Math.random() * 20 + 10,
              speed: Math.random() * 1 + 0.5,
              wind: Math.random() * 0.5 - 0.25
          });
      }
      requestAnimationFrame(updateHearts);
  }
  
  function resizeHearts() {
      width = heartCanvas.width = window.innerWidth;
      height = heartCanvas.height = window.innerHeight;
  }
  
  function updateHearts() {
      ctx.clearRect(0,0,width,height);
      for(var i = 0; i < heartsArr.length; i++){
          var h = heartsArr[i];
          h.y += h.speed;
          h.x += h.wind;
          if(h.y > height) {
              h.y = -h.size;
          }
          if(h.x > width) {
              h.x = 0;
          }
          if(h.x < 0) {
              h.x = width;
          }
          ctx.font = h.size + "px sans-serif";
          // Sử dụng màu đỏ cho trái tim rơi
          ctx.fillStyle = "#ff0000";
          ctx.fillText("♥", h.x, h.y);
      }
      requestAnimationFrame(updateHearts);
  }
  
  window.addEventListener('resize', resizeHearts);
  initHearts();
})();

/* -------------------------------
   Hiệu ứng Love Heart Cursor
------------------------------- */
var colours = ['#ff0000', '#ff0000', '#ff0000', '#ff0000', '#ff0000', '#ff0000'];
var minisize = 10;
var maxisize = 20;
var hearts = 100;
var over_or_under = "over";
var x = ox = 400;
var y = oy = 300;
var swide = 800;
var shigh = 600;
var sleft = sdown = 0;
var herz = [];
var herzx = [];
var herzy = [];
var herzs = [];
var kiss = false;
function addRVLoadEvent(funky) {
  var oldonload = window.onload;
  if (typeof oldonload != 'function') window.onload = funky;
  else window.onload = function() {
      if (oldonload) oldonload();
      funky();
  }
}
addRVLoadEvent(mwah);
function mwah() {
  if (document.getElementById) {
      var i, heart;
      for (i = 0; i < hearts; i++) {
          heart = createDiv("auto", "auto");
          heart.style.visibility = "hidden";
          heart.style.zIndex = (over_or_under == "over") ? "1001" : "0";
          heart.style.color = colours[i % colours.length];
          heart.style.pointerEvents = "none";
          if (navigator.appName == "Microsoft Internet Explorer")
              heart.style.filter = "alpha(opacity=75)";
          else
              heart.style.opacity = 0.45;
          heart.appendChild(document.createTextNode(String.fromCharCode(9829)));
          document.body.appendChild(heart);
          herz[i] = heart;
          herzy[i] = false;
      }
      set_scroll();
      set_width();
      herzle();
  }
}
function herzle() {
  var c;
  if (Math.abs(x - ox) > 1 || Math.abs(y - oy) > 1) {
      ox = x;
      oy = y;
      for (c = 0; c < hearts; c++) {
          if (herzy[c] === false) {
              herz[c].firstChild.nodeValue = String.fromCharCode(9829);
              herz[c].style.left = (herzx[c] = x - minisize / 2) + "px";
              herz[c].style.top = (herzy[c] = y - minisize) + "px";
              herz[c].style.fontSize = minisize + "px";
              herz[c].style.fontWeight = 'normal';
              herz[c].style.visibility = 'visible';
              herzs[c] = minisize;
              break;
          }
      }
  }
  for (c = 0; c < hearts; c++) {
      if (herzy[c] !== false) blow_me_a_kiss(c);
  }
  setTimeout(herzle, 30);
}
document.onmousedown = pucker;
document.onmouseup = function(){ clearTimeout(kiss); };
function pucker() {
  ox = -1;
  oy = -1;
  kiss = setTimeout(pucker, 100);
}
function blow_me_a_kiss(i) {
  herzy[i] -= herzs[i] / minisize + i % 2;
  herzx[i] += (i % 5 - 2) / 5;
  if (herzy[i] < sdown - herzs[i] || herzx[i] < sleft - herzs[i] || herzx[i] > sleft + swide - herzs[i]) {
      herz[i].style.visibility = "hidden";
      herzy[i] = false;
  } else if (herzs[i] > minisize + 1 && Math.random() < 2.5 / hearts) {
      break_my_heart(i);
  } else {
      if (Math.random() < maxisize / herzy[i] && herzs[i] < maxisize)
          herz[i].style.fontSize = (++herzs[i]) + "px";
      herz[i].style.top = herzy[i] + "px";
      herz[i].style.left = herzx[i] + "px";
  }
}
function break_my_heart(i) {
  var t;
  herz[i].firstChild.nodeValue = String.fromCharCode(9676);
  herz[i].style.fontWeight = 'bold';
  herzy[i] = false;
  for (t = herzs[i]; t <= maxisize; t++) {
      setTimeout(function(i, t){ return function(){ herz[i].style.fontSize = t + "px"; }; }(i, t), 60 * (t - herzs[i]));
  }
  setTimeout(function(i, t){ return function(){ herz[i].style.visibility = "hidden"; }; }(i, t), 60 * (t - herzs[i]));
}
document.onmousemove = mouse;
function mouse(e) {
  if (e) {
      y = e.pageY;
      x = e.pageX;
  } else {
      set_scroll();
      y = event.y + sdown;
      x = event.x + sleft;
  }
}
window.onresize = set_width;
function set_width() {
  var sw_min = 999999, sh_min = 999999;
  if (document.documentElement && document.documentElement.clientWidth) {
      if (document.documentElement.clientWidth > 0)
          sw_min = document.documentElement.clientWidth;
      if (document.documentElement.clientHeight > 0)
          sh_min = document.documentElement.clientHeight;
  }
  if (typeof(self.innerWidth) === 'number' && self.innerWidth) {
      if (self.innerWidth > 0 && self.innerWidth < sw_min)
          sw_min = self.innerWidth;
      if (self.innerHeight > 0 && self.innerHeight < sh_min)
          sh_min = self.innerHeight;
  }
  if (document.body.clientWidth) {
      if (document.body.clientWidth > 0 && document.body.clientWidth < sw_min)
          sw_min = document.body.clientWidth;
      if (document.body.clientHeight > 0 && document.body.clientHeight < sh_min)
          sh_min = document.body.clientHeight;
  }
  if (sw_min === 999999 || sh_min === 999999) {
      sw_min = 800;
      sh_min = 600;
  }
  swide = sw_min;
  shigh = sh_min;
}
window.onscroll = set_scroll;
function set_scroll() {
  if (typeof(self.pageYOffset) === 'number') {
      sdown = self.pageYOffset;
      sleft = self.pageXOffset;
  } else if (document.body && (document.body.scrollTop || document.body.scrollLeft)) {
      sdown = document.body.scrollTop;
      sleft = document.body.scrollLeft;
  } else if (document.documentElement && (document.documentElement.scrollTop || document.documentElement.scrollLeft)) {
      sleft = document.documentElement.scrollLeft;
      sdown = document.documentElement.scrollTop;
  } else {
      sdown = 0;
      sleft = 0;
  }
}
function createDiv(height, width) {
  var div = document.createElement("div");
  div.style.position = "absolute";
  div.style.height = height;
  div.style.width = width;
  div.style.overflow = "hidden";
  div.style.backgroundColor = "transparent";
  return div;
}

/* -------------------------------
   Nút phát nhạc & Chuyển trang
------------------------------- */
// Khi nhấn nút "playMusicButton", phát nhạc nếu chưa chạy
document.getElementById("playMusicButton").addEventListener("click", function(){
  var audioPlayer = document.getElementById("audioPlayer");
  audioPlayer.play().catch(function(error){
    console.log("Phát nhạc bị lỗi:", error);
  });
});

// Khi nhấn nút "nextButton", chuyển nội dung từ mainContent sang nextContent
document.getElementById("nextButton").addEventListener("click", function(){
  document.getElementById("mainContent").style.display = "none";
  document.getElementById("nextContent").style.display = "block";
});
