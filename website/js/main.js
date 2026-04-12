import "../css/styles.css";
 
import '../pages/index.html';

import { 
  createIcons, 
  Layers, 
  Github, 
  Menu, 
  Download, 
  Cpu, 
  Monitor, 
  Code2, 
  CheckCircle, 
  Terminal, 
  Apple 
} from 'lucide';

// Initialize the icons
createIcons({
  icons: {
    Layers,
    Github,
    Menu,
    Download,
    Cpu,
    Monitor,
    Code2,
    CheckCircle,
    Terminal,
    Apple
  }
});


// Tab switching logic
        function switchTab(type) {
            const iframeTab = document.getElementById('tab-iframe');
            const esmTab = document.getElementById('tab-esm');
            const iframeContent = document.getElementById('content-iframe');
            const esmContent = document.getElementById('content-esm');

            if (type === 'iframe') {
                iframeTab.classList.add('text-accent', 'border-accent');
                iframeTab.classList.remove('text-slate-500');
                esmTab.classList.remove('text-accent', 'border-accent');
                esmTab.classList.add('text-slate-500');
                iframeContent.classList.remove('hidden');
                esmContent.classList.add('hidden');
            } else {
                esmTab.classList.add('text-accent', 'border-accent');
                esmTab.classList.remove('text-slate-500');
                iframeTab.classList.remove('text-accent', 'border-accent');
                iframeTab.classList.add('text-slate-500');
                esmContent.classList.remove('hidden');
                iframeContent.classList.add('hidden');
            }
        }

        // Copy code helper
        function copyCode(elementId) {
            const text = document.getElementById(elementId).innerText;
            navigator.clipboard.writeText(text).then(() => {
                alert('Code copied to clipboard!');
            });
        }

// Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});

// Sticky header
window.addEventListener('scroll', () => {
  const header = document.querySelector('header');
  if (window.scrollY > 50) {
    header.classList.add('bg-dark/95', 'shadow-2xl', 'border-primary/20');
  } else {
    header.classList.remove('bg-dark/95', 'shadow-2xl', 'border-primary/20');
  }
});
