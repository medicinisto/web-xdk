import { register } from '../index';

const svg = () => `<svg class="layer-svg-media-play" width="100%" height="100%" viewBox="0 0 20 23" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" xmlns:serif="http://www.serif.com/" style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:1.41421;">
    <g transform="matrix(2,0,0,2,-20.0278,-16.699)">
        <g transform="matrix(1,0,0,1,-212,-981)">
            <g transform="matrix(1,0,0,1,212,981)">
                <path class="layer-svg-fillable" d="M19.279,14.857L11.528,19.508C11.055,19.792 10.441,19.639 10.156,19.165C10.063,19.01 10.014,18.832 10.014,18.65L10.014,9.35C10.014,8.797 10.462,8.35 11.014,8.35C11.195,8.35 11.373,8.399 11.528,8.492L19.279,13.143C19.753,13.427 19.906,14.041 19.622,14.514C19.538,14.655 19.42,14.773 19.279,14.857Z"/>
            </g>
        </g>
    </g>
</svg>`;

register({ svg, role: 'media-player-play' });
