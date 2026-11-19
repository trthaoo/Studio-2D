// perf.html: the performance dashboard of this machine (http://localhost:5200/perf.html, studio server running).
import { mountPerfPage } from './ui/perfPanel';
mountPerfPage(document.getElementById('perf')!);
