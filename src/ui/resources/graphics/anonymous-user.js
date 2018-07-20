import { register } from './index';

const svg = () => `<svg
   xmlns:dc="http://purl.org/dc/elements/1.1/"
   xmlns:cc="http://creativecommons.org/ns#"
   xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
   xmlns:svg="http://www.w3.org/2000/svg"
   xmlns="http://www.w3.org/2000/svg"
   viewBox="0 0 90 90"
   xml:space="preserve"
   version="1.1"
   id="svg2">
  <defs id="defs6">
    <clipPath id="clipPath18" clipPathUnits="userSpaceOnUse">
      <path style="clip-rule:evenodd"
         d="M 36,0 C 55.88225,0 72,16.11775 72,36 72,55.88225 55.88225,72 36,72 16.11775,72 0,55.88225 0,36 0,16.11775 16.11775,0 36,0 Z" />
    </clipPath>
    <clipPath clipPathUnits="userSpaceOnUse">
      <path d="m -406,-927 1980,0 0,2423 -1980,0 0,-2423 z" />
    </clipPath>
    <clipPath id="clipPath34" clipPathUnits="userSpaceOnUse">
      <path style="clip-rule:evenodd"
         d="m 36,36 c 5.96468,0 10.8,4.83532 10.8,10.8 0,5.96468 -4.83532,10.8 -10.8,10.8 C 30.03532,57.6 25.2,52.76468 25.2,46.8 25.2,40.83532 30.03532,36 36,36 Z" />
    </clipPath>
    <clipPath id="clipPath40" clipPathUnits="userSpaceOnUse">
      <path d="m -406,-927 1980,0 0,2423 -1980,0 0,-2423 z" />
    </clipPath>
    <clipPath id="clipPath50" clipPathUnits="userSpaceOnUse">
      <path style="clip-rule:evenodd"
         d="M 54,14.05934 C 54,23.52587 45.94113,31.2 36,31.2 26.05887,31.2 18,23.52587 18,14.05934 18,9.197705 26.76271,5.357156 36,5.48901 c 9.23729,0.131855 18,3.965441 18,8.57033 z" />
    </clipPath>
    <clipPath id="clipPath56" clipPathUnits="userSpaceOnUse">
      <path d="m -406,-927 1980,0 0,2423 -1980,0 0,-2423 z" />
    </clipPath>
  </defs>
  <g transform="matrix(1.25,0,0,-1.25,0,90)">
    <g id="g12" />
    <g id="g14">
      <g clip-path="url(#clipPath18)">
        <g clip-path="url(#clipPath24)">
          <path class="layer-svg-fillable" style="fill-opacity:1;fill-rule:nonzero;stroke:none"
            d="m -5,-5 82,0 0,82 -82,0 0,-82 z" />
        </g>
      </g>
    </g>
    <g>
      <g clip-path="url(#clipPath34)">
        <g clip-path="url(#clipPath40)">
          <path class="layer-svg-fillable-background" style="fill-opacity:1;fill-rule:nonzero;stroke:none"
            d="m 20.2,31 31.6,0 0,31.6 -31.6,0 0,-31.6 z" />
        </g>
      </g>
    </g>
    <g>
      <g clip-path="url(#clipPath50)">
        <g clip-path="url(#clipPath56)">
          <path class="layer-svg-fillable-background" style="fill-opacity:1;fill-rule:nonzero;stroke:none"
            d="m 13,0.4857143 46,0 0,35.7142897 -46,0 0,-35.7142897 z" />
        </g>
      </g>
    </g>
  </g>
</svg>`;

register({ svg, role: 'anonymous-user' });
