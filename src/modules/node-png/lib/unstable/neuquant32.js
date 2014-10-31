/* NeuQuant Neural-Net Quantization Algorithm
 * ------------------------------------------
 *
 * Copyright (c) 1994 Anthony Dekker
 *
 * NEUQUANT Neural-Net quantization algorithm by Anthony Dekker, 1994.
 * See "Kohonen neural networks for optimal colour quantization"
 * in "Network: Computation in Neural Systems" Vol. 5 (1994) pp 351-367.
 * for a discussion of the algorithm.
 * See also  http://members.ozemail.com.au/~dekker/NEUQUANT.HTML
 *
 * Any party obtaining a copy of these files from the author, directly or
 * indirectly, is granted, free of charge, a full and unrestricted irrevocable,
 * world-wide, paid up, royalty-free, nonexclusive right and license to deal
 * in this software and documentation files (the "Software"), including without
 * limitation the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons who receive
 * copies from any such party to do so, with the only requirement being
 * that this copyright notice remain intact.
 *
 *
 * Modified to process 32bit RGBA images.
 * Stuart Coyle 2004-2006
 *
 * Rewritten by Kornel Lesiński (2009)
 *
 * Ported to JavaScript by Igor Bezkrovny (2014)
 *
 */
/*
 * Rewritten by Kornel Lesiński (2009)
 * Euclidean distance, color matching dependent on alpha channel
 * and with gamma correction. code refreshed for modern compilers/architectures:
 * ANSI C, floats, removed pointer tricks and used arrays and structs.
 */




/* Program Skeleton
   ----------------
   	[select samplefac in range 1..30]
   	pic = (unsigned char*) malloc(4*width*height);
   	[read image from input file into pic]
	initnet(pic,4*width*height,samplefac,colors);
	learn();
	unbiasnet();
	[write output image header, using writecolourmap(f),
	possibly editing the loops in that function]
	inxbuild();
	[write output image using inxsearch(a,b,g,r)]		*/

module.exports = (function () {
	var MAXNETSIZE = 256; //256;
	/* maximum number of colours that can be used.
				  actual number is now passed to initcolors */

	/* four primes near 500 - assume no image has a length so large */
	/* that it is divisible by all four primes */
	var prime1 = 499;
	var prime2 = 491;
	var prime3 = 487;
	var prime4 = 503;

	/* minimum size for input image */
	var minpicturebytes = 4 * prime4;

	/*
		Network Definitions
	*/

	var maxnetpos = (MAXNETSIZE - 1);
	var ncycles = 100;
	/* no. of learning cycles */
	var ABS = function (a) {
		return ((a) >= 0 ? (a) : -(a));
	};

	/* defs for freq and bias */
	var gammashift = 10;
	/* gamma = 1024 */
	var gamma = 1 << gammashift;
	var betashift = 10;
	var beta = 1.0 / (1 << betashift);
	/* beta = 1/1024 */
	var betagamma = 1 << (gammashift - betashift);

	/* defs for decreasing radius factor */
	var initrad = MAXNETSIZE >> 3;
	/* for 256 cols, radius starts */
	var initradius = initrad * 1.0;
	/* and decreases by a           */
	var radiusdec = 30;
	/* factor of 1/30 each cycle    */

	/* defs for decreasing alpha factor */
	var alphabiasshift = 10;
	/* alpha starts at 1.0 */
	var initalpha = 1 << alphabiasshift;
	var alphadec;
	/* biased by 10 bits */

	/* radbias and alpharadbias used for radpower calculation */
	var radbiasshift = 8;
	var radbias = 1 << radbiasshift;
	var alpharadbshift = alphabiasshift + radbiasshift;
	var alpharadbias = 1 << alpharadbshift;

	/*
		Types and Global Variables
	*/
	var thepicture;
	/* the input image itself */
	var lengthcount;
	/* lengthcount = H*W*4 */

	function Pixel (r, g, b, a) { /* ABGRc */
		this.r = r;
		this.g = g;
		this.b = b;
		this.a = a;
	}

	var network = [];
	/* the network itself */

	/* for network lookup - really 256 */
	var netindex = []; // size = 256

	/* bias and freq arrays for learning */
	var bias = []; // size = MAXNETSIZE
	var freq = []; // size = MAXNETSIZE

	/* radpower for precomputation */
	var radpower = []; // size = initrad

	/* Number of colours to use. */
	var netsize;

	/* 1.0/2.2 usually */
	var gamma_correction;

	/* Biasvalues: based on frequency of nearest pixels */
	var biasvalues = []; // size = 256

	/*
		Initialise network in range (0,0,0,0) to (255,255,255,255) and set parameters
	*/
	function initnet (thepic, len, colours, gamma_c) {
		var i;

		gamma_correction = gamma_c;

		/* Clear out network from previous runs */
		/* thanks to Chen Bin for this fix */

		// MAXNETSIZE should be 2^x, where 2^x >= colours
		MAXNETSIZE = Math.pow(2, (Math.log(colours * 2 - 1) / Math.LN2) | 0);
		console.log("MAXNETSIZE = " + MAXNETSIZE);
		initrad = MAXNETSIZE >> 3;
		initradius = initrad;
		maxnetpos = (MAXNETSIZE - 1);
		bias = [];
		freq = [];
		netindex = [];
		network = [];
		radpower = [];
		colormap = [];
		for (i = 0; i < MAXNETSIZE; i++) {
			network[i] = new Pixel(0, 0, 0, 0);
		}

		thepicture = thepic;
		lengthcount = len;
		netsize = colours;

		for (i = 0; i < 256; i++) {
			var temp = Math.pow(i / 255.0, 1.0 / gamma_correction) * 255.0;
			temp = Math.round(temp);
			biasvalues[i] = temp;
		}

		for (i = 0; i < netsize; i++) {
			network[i].b = network[i].g = network[i].r = biasvalue(i * 256 / netsize);

			/*  Sets alpha values at 0 for dark pixels. */
			if (i < 16) {
				network[i].a = (i * 16);
			} else {
				network[i].a = 255;
			}

			freq[i] = 1.0 / netsize;
			/* 1/netsize */
			bias[i] = 0;
		}
	}

	function unbiasvalue (temp) {
		if (temp < 0) {
			return 0;
		}

		temp = Math.pow(temp / 255.0, gamma_correction) * 255.0;
		temp = Math.floor(temp / 255.0 * 256.0);

		if (temp > 255) {
			return 255;
		}
		return temp | 0;
	}

	function round_biased (temp) {
		if (temp < 0) {
			return 0;
		}
		temp = Math.floor(temp / 255.0 * 256.0);

		if (temp > 255) {
			return 255;
		}
		return temp | 0;
	}

	function biasvalue (temp) {
		return biasvalues[temp];
	}

	/* Output colormap to unsigned char ptr in RGBA format */
	function getcolormap (palette) {
		for (var j = 0, index = 0; j < netsize; j++) {
			palette[j] = [
				unbiasvalue(network[j].r),
				unbiasvalue(network[j].g),
				unbiasvalue(network[j].b),
				round_biased(network[j].a)
			];
		}
	}

	/* Insertion sort of network and building of netindex[0..255] (to do after unbias)
	   ------------------------------------------------------------------------------- */
	function ColorMap (r, g, b, a) {
		this.r = r;
		this.g = g;
		this.b = b;
		this.a = a;
	}

	var colormap = [];

	function inxbuild() 	{
		var i, j, smallpos, smallval;

		for (i = 0; i < netsize; i++) {
			colormap[i] = new ColorMap(
				biasvalue(unbiasvalue(network[i].r)),
				biasvalue(unbiasvalue(network[i].g)),
				biasvalue(unbiasvalue(network[i].b)),
				round_biased(network[i].a)
			);
		}

		var previouscol = 0,
			startpos = 0;

		for (i = 0; i < netsize; i++) {
			smallpos = i;
			smallval = (colormap[i].g);
			/* index on g */
			/* find smallest in i..netsize-1 */
			for (j = i + 1; j < netsize; j++) {
				if ((colormap[j].g) < smallval) {       /* index on g */
					smallpos = j;
					smallval = (colormap[j].g);
					/* index on g */
				}
			}
			/* swap colormap[i] (i) and colormap[smallpos] (smallpos) entries */
			if (i != smallpos) {
				var temp;
				temp = network[smallpos];
				network[smallpos] = network[i];
				network[i] = temp;
				temp = colormap[smallpos];
				colormap[smallpos] = colormap[i];
				colormap[i] = temp;
			}
			/* smallval entry is now in position i */
			if (smallval != previouscol) {
				netindex[previouscol] = (startpos + i) >> 1;
				for (j = previouscol + 1; j < smallval; j++) {
					netindex[j] = i;
				}
				previouscol = smallval;
				startpos = i;
			}
		}
		netindex[previouscol] = (startpos + maxnetpos) >> 1;

		/* really 256 */
		for (j = previouscol + 1; j < 256; j++) {
			netindex[j] = maxnetpos;
		}
	}

	function colorimportance (alpha) {
		var transparency = 1.0 - alpha / 255.0;
		return (1.0 - transparency * transparency);
	}

	/* Search for ABGR values 0..255 (after net is unbiased) and return colour index
	   ---------------------------------------------------------------------------- */
	function slowinxsearch (al, b, g, r) {
		var i, best = 0;
		var a, bestd = Infinity, dist;

		r = biasvalue(r);
		g = biasvalue(g);
		b = biasvalue(b);

		var colimp = colorimportance(al);

		for (i = 0; i < netsize; i++) {
			a = colormap[i].r - r;
			dist = a * a * colimp;

			a = colormap[i].g - g;
			dist += a * a * colimp;

			a = colormap[i].b - b;
			dist += a * a * colimp;

			a = colormap[i].a - al;
			dist += a * a;

			if (dist < bestd) {
				bestd = dist;
				best = i;
			}
		}
		return best;
	}

	function inxsearch (al, b, g, r) {
		var i, j, best;
		var dist, a, bestd;

		bestd = Infinity;
		/* biggest possible dist */
		best = 0;

		if (al) {
			r = biasvalue(r);
			g = biasvalue(g);
			b = biasvalue(b);
		} else {
			r = g = b = 0;
		}

		i = netindex[g];
		/* index on g */
		j = i - 1;
		/* start at netindex[g] and work outwards */

		var colimp = colorimportance(al);
		while ((i < netsize) || (j >= 0)) {
			if (i < netsize) {
				a = colormap[i].g - g;
				/* inx key */
				dist = a * a * colimp;
				if (dist > bestd) {
					/* stop iter */
					break;
				} else {
					a = colormap[i].r - r;
					dist += a * a * colimp;
					if (dist < bestd) {
						a = colormap[i].b - b;
						dist += a * a * colimp;
						if (dist < bestd) {
							a = colormap[i].a - al;
							dist += a * a;
							if (dist < bestd) {
								bestd = dist;
								best = i;
							}
						}
					}
					i++;
				}
			}
			if (j >= 0) {
				a = colormap[j].g - g;
				/* inx key - reverse dif */
				dist = a * a * colimp;
				if (dist > bestd) {
					/* stop iter */
					break;
				} else {
					a = colormap[j].b - b;
					dist += a * a * colimp;
					if (dist < bestd) {
						a = colormap[j].r - r;
						dist += a * a * colimp;
						if (dist < bestd) {
							a = colormap[j].a - al;
							dist += a * a;
							if (dist < bestd) {
								bestd = dist;
								best = j;
							}
						}
					}
					j--;
				}
			}
		}
		return best;
	}

	/* Search for biased ABGR values
	   ---------------------------- */

	function contest (al, b, g, r) {
		/* finds closest neuron (min dist) and updates freq */
		/* finds best neuron (min dist-bias) and returns position */
		/* for frequently chosen neurons, freq[i] is high and bias[i] is negative */
		/* bias[i] = gamma*((1/netsize)-freq[i]) */

		var dist, a, betafreq, bestd, bestbiasd; // double
		var i, bestpos, bestbiaspos; // int

		bestd = Infinity;
		bestbiasd = bestd;
		bestpos = 0;
		bestbiaspos = bestpos;

		/* Using colorimportance(al) here was causing problems with images that were close to monocolor.
		   See bug reports: 3149791, 2938728, 2896731 and 2938710
		*/
		var colimp = 1.0; // double colorimportance(al);

		for (i = 0; i < netsize; i++) {
			var bestbiasd_biased = bestbiasd + bias[i];

			a = network[i].b - b;
			dist = ABS(a) * colimp;
			a = network[i].r - r;
			dist += ABS(a) * colimp;

			if (dist < bestd || dist < bestbiasd_biased) {
				a = network[i].g - g;
				dist += ABS(a) * colimp;
				a = network[i].a - al;
				dist += ABS(a);

				if (dist < bestd) {
					bestd = dist;
					bestpos = i;
				}
				if (dist < bestbiasd_biased) {
					bestbiasd = dist - bias[i];
					bestbiaspos = i;
				}
			}
			betafreq = freq[i] / (1 << betashift);
			freq[i] -= betafreq;
			bias[i] += betafreq * (1 << gammashift);
		}
		freq[bestpos] += beta;
		bias[bestpos] -= betagamma;
		return bestbiaspos;
	}

	/* Move neuron i towards biased (a,b,g,r) by factor alpha
	   ---------------------------------------------------- */
	function altersingle (alpha, i, al, b, g, r) {
		var colorimp = 1.0;//0.5;// + 0.7*colorimportance(al);

		alpha /= initalpha;

		/* alter hit neuron */
		network[i].a -= alpha * (network[i].a - al);
		network[i].b -= colorimp * alpha * (network[i].b - b);
		network[i].g -= colorimp * alpha * (network[i].g - g);
		network[i].r -= colorimp * alpha * (network[i].r - r);
	}

	/* Move adjacent neurons by precomputed alpha*(1-((i-j)^2/[r]^2)) in radpower[|i-j|] */
	function alterneigh (rad, i, al, b, g, r) {
		var j, hi, k, lo; // int
		var a; // double

		lo = i - rad;
		if (lo < 0) {
			lo = 0;
		}
		hi = i + rad;
		if (hi > netsize - 1) {
			hi = netsize - 1;
		}

		j = i + 1;
		k = i - 1;
		var index = 0;
		while ((j <= hi) || (k >= lo)) {
			a = (radpower[++index]) / alpharadbias;
			if (j <= hi) {
				network[j].a -= a * (network[j].a - al);
				network[j].b -= a * (network[j].b - b);
				network[j].g -= a * (network[j].g - g);
				network[j].r -= a * (network[j].r - r);
				j++;
			}
			if (k >= lo) {
				network[k].a -= a * (network[k].a - al);
				network[k].b -= a * (network[k].b - b);
				network[k].g -= a * (network[k].g - g);
				network[k].r -= a * (network[k].r - r);
				k--;
			}
		}
	}

	/* Main Learning Loop */
	/* sampling factor 1..30 */
	function learn (samplefac, verbose) { /* Stu: N.B. added parameter so that main() could control verbosity. */
		var i, j, al, b, g, r, rad, step, delta, samplepixels; // int
		var radius, alpha; // double
		var p = 0, lim = lengthcount; // char*

		alphadec = 30 + (samplefac - 1) / 3;
		samplepixels = (lengthcount / (4 * samplefac)) | 0;
		delta = (samplepixels / ncycles) | 0;
		/* here's a problem with small images: samplepixels < ncycles => delta = 0 */

		/* kludge to fix */
		if (delta == 0) {
			delta = 1;
		}

		alpha = initalpha;
		radius = initradius;

		rad = radius | 0;
		if (rad <= 1) {
			rad = 0;
		}

		for (i = 0; i < rad; i++) {
			radpower[i] = Math.floor(alpha * (((rad * rad - i * i) * radbias) / (rad * rad)));
		}

		if (verbose) {
			console.log("beginning 1D learning: initial radius=" + rad);
		}

		if ((lengthcount % prime1) != 0) {
			step = 4 * prime1;
		} else {
			if ((lengthcount % prime2) != 0) {
				step = 4 * prime2;
			} else {
				if ((lengthcount % prime3) != 0) {
					step = 4 * prime3;
				} else {
					step = 4 * prime4;
				}
			}
		}

		i = 0;
		while (i < samplepixels) {
			if (thepicture[p + 3]) {
				al = thepicture[p + 3];
				b = biasvalue(thepicture[p + 2]);
				g = biasvalue(thepicture[p + 1]);
				r = biasvalue(thepicture[p + 0]);
			} else {
				al = r = g = b = 0;
			}
			j = contest(al, b, g, r);

			altersingle(alpha, j, al, b, g, r);
			/* alter neighbours */
			if (rad) {
				alterneigh(rad, j, al, b, g, r);
			}

			p += step;
			while (p >= lim) {
				p -= lengthcount;
			}

			i++;
			if (i % delta == 0) {                    /* FPE here if delta=0*/
				alpha -= alpha / alphadec;
				radius -= radius / radiusdec;
				rad = radius | 0;
				if (rad <= 1) {
					rad = 0;
				}
				for (j = 0; j < rad; j++) {
					radpower[j] = Math.floor(alpha * (((rad * rad - j * j) * radbias) / (rad * rad)));
				}
			}
		}
		if (verbose) {
			console.log("finished 1D learning: final alpha=" + ((alpha / initalpha) | 0));
		}
	}

	function NeuQuant32 (options) {
		this._samplefac = options.samplefac;
		this._colors = options.colors;
	}

	NeuQuant32.prototype = {
		sample : function (buffer, width) {
			var height = buffer.length / 4 / width;

			initnet(buffer,4*width*height,this._colors,1);
			learn(this._samplefac, true);
			inxbuild();
			//unbiasnet();

			this._palette = [];
			getcolormap(this._palette);

			console.log("sample: widthxheight = " + width + "x" + height);
		},

		palette : function () {
			return this._palette;
		},

		getReduced8 : function (palette, rgbaFlatArray) {
			var out = [],
				position = 0;

			for (var i = 0; i < rgbaFlatArray.length; i += 4, position++) {
				out[position] = inxsearch(
					rgbaFlatArray.readUInt8(i + 3),
					rgbaFlatArray.readUInt8(i + 2),
					rgbaFlatArray.readUInt8(i + 1),
					rgbaFlatArray.readUInt8(i + 0)
				);
			}

			console.log("getReduced8 pixels: " + out.length);
			return out;
		},

		getReduced32 : function (palette, rgbaFlatArray) {
			var out = new Buffer(rgbaFlatArray.length);
			for (var i = 0; i < rgbaFlatArray.length; i += 4) {
				var index = inxsearch(
					rgbaFlatArray[i + 3],
					rgbaFlatArray[i + 2],
					rgbaFlatArray[i + 1],
					rgbaFlatArray[i + 0]
				);
				out[i] = palette[index][0];
				out[i + 1] = palette[index][1];
				out[i + 2] = palette[index][2];
				out[i + 3] = palette[index][3];
			}
			return out;
		}
	};

	return NeuQuant32;
})();
