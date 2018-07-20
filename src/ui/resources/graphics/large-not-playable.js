
import { register } from './index';

const svg = () => `<svg viewBox="0 0 28 28" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
        <g transform="translate(-212.000000, -981.000000)">
            <g transform="translate(212.000000, 981.000000)" class="layer-svg-fillable">
                <path d="M14,28 C21.7319865,28 28,21.7319865 28,14 C28,6.2680135 21.7319865,0 14,0 C6.2680135,0 0,6.2680135 0,14 C0,21.7319865 6.2680135,28 14,28 Z M19.2791785,14.8574929 L11.5283846,19.5079692 C11.0548044,19.7921174 10.4405441,19.6385523 10.156396,19.164972 C10.0631467,19.0095566 10.0138889,18.8317202 10.0138889,18.6504763 L10.0138889,9.34952371 C10.0138889,8.79723896 10.4616041,8.34952371 11.0138889,8.34952371 C11.1951328,8.34952371 11.3729692,8.39878155 11.5283846,8.49203079 L19.2791785,13.1425071 C19.7527587,13.4266552 19.9063238,14.0409155 19.6221756,14.5144958 C19.5377259,14.6552454 19.4199281,14.7730432 19.2791785,14.8574929 Z"></path>
            </g>
            <g>
                <path class="layer-svg-strokable" stroke-width="3" d="M217,986 L235,1004"></path>
                <path class="layer-svg-strokable-background" stroke-width="1" d="M217,986 L235,1004"></path>
            </g>
            <g>
                <circle class="layer-svg-strokable-background" stroke-width="2" cx="226" cy="995" r="13"></circle>
                <circle class="layer-svg-strokable" stroke-width="1" cx="226" cy="995" r="13.5"></circle>
            </g>
        </g>
    </g>
</svg>`;

register({ svg, role: 'large-not-playable' });
