import { register } from './index';

const svg = () => `<svg class="layer-svg-star" width="100%" height="100%" viewBox="0 0 144 144" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" xmlns:serif="http://www.serif.com/" style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:1.41421;">
    <g transform="matrix(2,0,0,2,0,0)">
        <g transform="matrix(5.66064,0,0,5.66064,-14.9458,-10.7003)">
            <path class="layer-svg-fillable layer-svg-strokable" d="M9,11.3L12.71,14L11.29,9.64L15,7L10.45,7L9,2.5L7.55,7L3,7L6.71,9.64L5.29,14L9,11.3Z" style="fill-rule:nonzero;stroke-width:0.53px;"/>
        </g>
    </g>
</svg>`;

register({ svg, role: 'star' });
