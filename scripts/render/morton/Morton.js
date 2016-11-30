'use strict';

const mx = [ 0, 1 ];
const my = [ 0, 2 ];
for (let i = 4; i < 0xFFFF; i <<= 2) {
	for (let j = 0, l = mx.length; j < l; j++) {
		mx.push((mx[j] | i));
		my.push((mx[j] | i) << 1);
	}
}

function morton(x, y) {
	return (my[y & 0xFF] | mx[x & 0xFF]) +
		(my[(y >> 8) & 0xFF] | mx[(x >> 8) & 0xFF]) * 0x10000; // +
		//(my[(y >> 16) & 0xFF] | mx[(x >> 16) & 0xFF]) * 0x100000000;
}

module.exports = morton;
