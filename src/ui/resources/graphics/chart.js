import { register } from './index';

const svg = () => `<svg class="layer-svg-chart" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd" stroke-linecap="round" stroke-linejoin="round">
        <g class="layer-svg-strokable" stroke-width="1.5">
            <g transform="translate(-12.750000, 2.250000)">
                <circle cx="24.5789474" cy="9.57894737" r="9.57894737"></circle>
                <path class="layer-svg-fillable" d="M23.7599209,1.23010051 L23.7599209,10.4892658 L31.7881652,15.2134055 C31.7881652,15.2134055 21.4081727,24.3272419 16.283138,13.6661915 C11.1581034,3.00514103 23.7599209,1.23010051 23.7599209,1.23010051 Z"></path>
            </g>
        </g>
    </g>
</svg>`;

register({ svg, role: 'chart' });
