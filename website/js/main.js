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
document.addEventListener('click', (e) => {
    // 1. Tab Switching Logic
    const tabBtn = e.target.closest('[data-tab-target]');
    if (tabBtn) {
        const target = tabBtn.dataset.tabTarget;
        const container = tabBtn.closest('.glass-morphism');

        // Update Buttons: Reset all, then activate current
        container.querySelectorAll('[data-tab-target]').forEach(btn => {
            btn.classList.remove('text-accent', 'border-accent');
            btn.classList.add('text-slate-500');
        });
        tabBtn.classList.add('text-accent', 'border-accent');
        tabBtn.classList.remove('text-slate-500');

        // Update Content: Hide all, then show target
        container.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('hidden', content.id !== `content-${target}`);
        });
        return; // Exit early
    }

    // 2. Copy to Clipboard Logic
    const copyBtn = e.target.closest('[data-copy-target]');
    if (copyBtn) {
        const targetId = copyBtn.dataset.copyTarget;
        const text = document.getElementById(targetId).innerText;

        navigator.clipboard.writeText(text).then(() => {
            // Visual feedback using the accent color
            const originalColor = copyBtn.style.color;
            copyBtn.style.color = '#22D3EE';
            
            // Temporary tooltip-like effect or icon swap
            setTimeout(() => {
                copyBtn.style.color = originalColor;
            }, 800);
        });
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
