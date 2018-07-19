import { register } from './index';

const svg = () => `<svg class="layer-svg-next-arrow" width="100%" height="100%" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <g>
        <polygon class="layer-svg-fillable layer-svg-strokable" points="8.59 16.34 13.17 11.75 8.59 7.16 10 5.75 16 11.75 10 17.75"></polygon>
    </g>
</svg>`;

register({ svg, role: 'next-arrow' });
