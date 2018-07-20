import { register } from '../index';

const svg = () => `<svg class="layer-svg-media-player-volume" width="100%" height="100%" viewBox="0 0 48 48" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" xmlns:serif="http://www.serif.com/" style="fill-rule:evenodd;clip-rule:evenodd;stroke-linecap:round;stroke-linejoin:bevel;stroke-miterlimit:1;">
<g transform="matrix(2,0,0,2,0,0)">
    <g transform="matrix(1,0,0,1,-0.255833,-0.0132395)">
        <path class="layer-svg-fillable" d="M3.319,9.8C3.324,10.586 3.327,13.236 3.319,13.8C3.378,14.47 3.67,14.691 4.319,14.77C5.002,14.773 7.319,14.77 7.319,14.77L12.319,17.8L12.319,5.8L7.319,8.77C7.319,8.77 4.934,8.768 4.319,8.77C3.773,8.837 3.342,9.228 3.319,9.8M14.319,7.74C14.319,7.74 14.319,8.987 14.319,9.748C15.514,10.746 15.423,12.76 14.319,13.8C14.319,14.463 14.319,15.79 14.319,15.79C17.516,14.213 17.491,9.326 14.319,7.74M14.319,3.7L14.319,5.7C20.142,7.433 20.149,16.065 14.319,17.8L14.319,19.8C16.13,19.161 18.046,18.256 19.268,16.683C21.447,13.877 21.014,9.771 19.332,6.893C18.33,5.179 16.155,4.151 14.319,3.7" style="fill-rule:nonzero;"/>
    </g>
</g>
</svg>`;

register({ svg, role: 'media-player-volume' });
