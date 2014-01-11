// Implementation based on shamir_threshold_scheme.c from https://gist.github.com/genos/1313643
// Translated to Javascript by Karl Gluck
// Requires BigInt.js

// Wrap all functions
(function () {
  
  // Modular exponentiation, via Wikipedia and Schneier's "Applied Cryptography"
  function expt_mod(/*BigInt*/ b, /*BigInt*/ e, /*BigInt*/ m) {
      var r = new BigInt(1);
      while (!e.isZero()) {
          if (e.isBit0Set()) { // if (e & 1)
              r = r.mulMod(b, m);  // r = (r * b) % m;
          }
          e = e.rightShift(1);     // e >>= 1;
          b = b.mulMod(b, m);  // b = (b * b) % m;
      }
      return r;
  }
 
 
  // Modular inverse; x^{phi(p) - 1} = 1 mod p, and p prime => phi(p) = p - 1
  function mod_inv(/*BigInt*/x, /*BigInt*/ p) {
      return expt_mod(x, p.sub(new BigInt(2)), p);
  }
 
 
  // Horner's method to evaluate polynomial given by coeffs[] modulo `mod`
  function horner_mod(/*BigInt*/ x, /*BigInt[]*/ coeffs, /*uint*/ k, /*BigInt*/ mod) {
      /*BigInt*/ var i;
      /*BigInt*/ var y = new BigInt(0);
 
      for (i = k - 1; i > 0; i--) {
          y = y.add(coeffs[i]).mod(mod);    // y = (y + coeffs[i]) % mod;
          y = y.mulMod(x, mod);             // y = (y * x) % mod;
      }
      y = y.add(coeffs[0]).mod(mod);        // y = (y + coeffs[0]) % mod;
 
      return y;
  }
 
  // Shamir (k, n) threshold scheme
  // s - the secret you're saving
  // k - the minimum number to reconstruct the secret
  // n - the number of participants
  // p - a prime number > max(s, n)
  // returns an array of {x:<>, y:<>} objects with the encoding points
  function shamir_threshold(bits, /*BigInt*/ s, /*ulong*/ k, /*ulong*/ n, /*BigInt*/ p){
      var i, j;
      var unique;
      var x, coeffs = new Array(k);
      var xy_pairs = new Array(n);
      var psub2 = new BigInt(p).sub(new BigInt(2));

      if (!p.greaterThan(s) || !p.greaterThan(n)) { throw "p <= max(s,n)"; }
 
      coeffs[0] = s;
      for (i = 1; i < k; i++) {
          coeffs[i] = BigInt.random(bits,0).mod(psub2).add(new BigInt(1)); // coeffs[i] = (ulong)(1 + (rand() % (p - 2)));
      }
 
      for (i = 0; i < n; i++) {
          unique = 0;
          while (!unique) {
              unique = 1;
              x = BigInt.random(bits,0).mod(psub2).add(new BigInt(1));  // x = (ulong)(1 + (rand() % (p - 2)));
              for (j = 0; j < i; j++) {
                  if (xy_pairs[j].x.equals(x)) {
                      unique = 0;
                      break;
                  }
              }
          }

          xy_pairs[i] = {
            x: x,
            y: horner_mod(x, coeffs, k, p)
          }
      }

      return xy_pairs;
  }
 
 
  // Lagrange interpolation to recover the constant term
  // xy_pairs - an array of {x:<>, y:<>} objects with the encoding points
  // k - the minimum number to reconstruct the secret
  // p - a prime number > max(s, n)
  function interp_const(/*point[]*/ xy_pairs, /*ulong*/ k, /*BigInt*/ p){
      var i, j;
      var c;
      var s = new BigInt(0);
 
      for (i = 0; i < k; i++) {
          c = new BigInt(1);
          for (j = 0; j < k; j++) {
              if (xy_pairs[i].x.greaterThan(xy_pairs[j].x)) {
                  // c = (c * xy_pairs[j].x * mod_inv(p - (xy_pairs[i].x - xy_pairs[j].x), p)) % p;
                  c = c.mul(xy_pairs[j].x).mulMod(mod_inv(p.sub(xy_pairs[i].x.sub(xy_pairs[j].x)), p), p);
              }
              else if (xy_pairs[j].x.greaterThan(xy_pairs[i].x)) {
                  // c = (c * xy_pairs[j].x * mod_inv(xy_pairs[j].x - xy_pairs[i].x, p)) % p;
                c = c.mul(xy_pairs[j].x).mulMod(mod_inv(xy_pairs[j].x.sub(xy_pairs[i].x), p), p);
              }
              else {
                  continue;
              }
          }
          s = s.add(xy_pairs[i].y.mul(c)).mod(p);   //s = (s + xy_pairs[i].y * c) % p;
      }
      return s;
  }
  
  function ThresholdCrypto() { this.init.apply(this, arguments) };
  ThresholdCrypto.prototype = {

    init: function (bits, n, k, p) {
      this.bits = bits;
      this.n = n;
      this.k = k;
      this.p = p; // the prime number
    },

    encrypt: function (s) {
      return shamir_threshold(this.bits, s, this.k, this.n, this.p);
    },

    decrypt: function (xy_pairs) {
      return interp_const(xy_pairs, this.k, this.p);
    },

    valueOf: function () {
      throw "";
    }
  };

  var Global = (function () { return this })();
  Global.ThresholdCrypto = ThresholdCrypto;

})();
