What is ThresholdJS?
====================

ThresholdJS implements [Shamir's Secret Sharing](http://en.wikipedia.org/wiki/Shamir's_Secret_Sharing) algorithm with no frills. Given a secret number S, a prime number p > S, a number of shares n and a threshold k, it returns n (x,y) coordinates such that one can recover S given p, n, k and any k of those coordinates.

It is a direct translation of the [C implementation](https://gist.github.com/genos/1313643) posted by [GitHub user Genos](https://github.com/genos) cross-referenced with the original paper "How to Share a Secret" published in 1979.

This code was created with the intent to split Bitcoin private keys into many parts so that the key can be safely stored in a distributed fashion. One could print some out and give them to friends, hide others in pictures uploaded to image-sharing websites ([steganography](http://en.wikipedia.org/wiki/Steganography"></a>)) and secure some in safety deposit boxes. The more places the better!

I wrote this because I was interested in the math behind the algorithm and wanted to create an implementation that I had confidence in.

What's Unique?
==============

[Other](https://github.com/amper5and/secrets.js) [implementations](http://rosick.com/crypto/sss.html) are long and opaque. This one is short and simple, which makes it easy to verify.

Its simplicity comes from one key point: it makes use of a large integer object.

Shamir's Secret Sharing algorithm relies on a large prime number. It must be bigger than any number you wish to split, so others usually split the secret into 32-bit chunks and use a hard-coded 33-bit prime in the algorithm. The secret is padded to a 32-bit boundary, each chunk is split individually, and the i'th piece from each is concatenated to make the i'th share of the secret. The parameters n and k are then tacked on and whole thing is hex encoded.

Since I know I'm encoding a single 256-bit number, this code does not do that. Instead, it just use a prime large enough to encode the entire secret: [2^257-93](http://primes.utm.edu/lists/2small/200bit.html). This number was chosen because it is easily remembered or looked up since it's the largest 257-bit prime.
