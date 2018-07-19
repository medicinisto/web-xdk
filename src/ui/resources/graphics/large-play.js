import { register } from './index';

const svg = () => `<svg class="layer-svg-large-play" viewBox="0 0 28 28" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
      <circle class="layer-svg-fillable" cx="14" cy="14" r="14"></circle>
      <path d="M13.3043608,12.0806949 C14.4402726,10.1875085 16.280463,10.1850309 17.4178614,12.0806949 L19.7210275,15.9193051 C20.8569393,17.8124915 19.9933578,19.3472222 17.7875781,19.3472222 L12.9346441,19.3472222 C10.7309177,19.3472222 9.86379633,17.8149691 11.0011947,15.9193051 L13.3043608,12.0806949 Z" class="layer-svg-fillable-background" transform="translate(15.361111, 14.000000) rotate(90.000000) translate(-15.361111, -14.000000) "></path>
    </g>
</svg>`;

register({ svg, role: 'large-play' });
