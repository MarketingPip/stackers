import "../css/styles.css";
 
import '../css/styles.css';

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
