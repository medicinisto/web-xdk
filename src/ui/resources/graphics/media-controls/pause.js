import { register } from '../index';

const svg = () => `<svg class="layer-svg-media-pause" width="100%" height="100%" viewBox="0 0 20 24" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" xmlns:serif="http://www.serif.com/" style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:1.41421;">
    <g transform="matrix(2,0,0,2,-18,-16)">
        <path class="layer-svg-fillable" id="icon_pause" d="M17.356,8C18.264,8 19,8.736 19,9.644L19,18.356C19,19.264 18.264,20 17.356,20C16.448,20 15.712,19.264 15.712,18.356L15.712,9.644C15.712,8.736 16.448,8 17.356,8ZM10.644,8C11.552,8 12.288,8.736 12.288,9.644L12.288,18.356C12.288,19.264 11.552,20 10.644,20C9.736,20 9,19.264 9,18.356L9,9.644C9,8.736 9.736,8 10.644,8Z"/>
    </g>
</svg>`;

register({ svg, role: 'media-player-pause' });
