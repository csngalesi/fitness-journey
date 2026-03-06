/**
 * Fitness Journey MED - Progress Photos Module
 */

(function () {
    'use strict';

    const PhotoModule = {
        state: {
            photos: [
                // Mock initial data
                { id: 1, date: '2026-02-01', bf: 18, weight: 82, url: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=2070&auto=format&fit=crop' },
                { id: 2, date: '2026-03-01', bf: 16, weight: 80, url: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=2120&auto=format&fit=crop' }
            ]
        },

        render() {
            const container = document.getElementById('photo-content-area');

            container.innerHTML = `
                <div class="macro-summary mb-3" style="font-size: 0.9rem; text-align: center;">
                    <strong>Seu Progresso de Composição Corporal</strong><br>
                    <span style="color:var(--text-muted)">O espelho é o seu melhor avaliador.</span>
                </div>
                
                <div style="background: var(--bg-dark); padding: 1rem; border-radius: 12px; border: 1px dashed var(--primary); text-align: center; margin-bottom: 2rem;" id="upload-box">
                    <i class="fa-solid fa-cloud-arrow-up" style="font-size: 2rem; color: var(--primary); margin-bottom: 0.5rem;"></i>
                    <h5 style="margin-bottom: 0.5rem;">Adicionar Nova Foto</h5>
                    
                    <div style="display:flex; gap: 0.5rem; justify-content: center; align-items: center; margin-top: 1rem; margin-bottom: 1rem;">
                        <input type="date" id="photo-date" class="form-control" style="width: auto; padding: 0.5rem;" value="${new Date().toISOString().split('T')[0]}">
                        <input type="number" id="photo-bf" class="form-control" placeholder="% BF Estimado" style="width: 120px; padding: 0.5rem; text-align: center;">
                        <input type="number" id="photo-weight" class="form-control" placeholder="Peso (kg)" style="width: 100px; padding: 0.5rem; text-align: center;">
                    </div>

                    <button class="btn btn-primary" id="btn-upload-photo" style="padding: 0.5rem 2rem;">
                        <i class="fa-solid fa-camera"></i> Escolher Arquivo
                    </button>
                    <input type="file" id="file-input" accept="image/*" style="display: none;">
                </div>
                
                <h4 class="mt-4 mb-3" style="font-family: var(--font-display);">Galeria de Evolução</h4>
                <div id="gallery-grid" style="display:grid; grid-template-columns: 1fr 1fr; gap:0.8rem;">
                </div>
            `;

            this.bindEvents();
            this.renderGallery();
        },

        bindEvents() {
            const btnUpload = document.getElementById('btn-upload-photo');
            const fileInput = document.getElementById('file-input');
            const uploadBox = document.getElementById('upload-box');

            btnUpload.addEventListener('click', () => {
                fileInput.click();
            });

            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const date = document.getElementById('photo-date').value;
                    const bf = document.getElementById('photo-bf').value;
                    const weight = document.getElementById('photo-weight').value;

                    // Create a blob URL to preview the newly added image locally
                    const url = URL.createObjectURL(file);

                    this.state.photos.push({
                        id: Date.now(),
                        date: date,
                        bf: bf ? parseFloat(bf) : '?',
                        weight: weight ? parseFloat(weight) : '?',
                        url: url
                    });

                    // Sort by date descending
                    this.state.photos.sort((a, b) => new Date(b.date) - new Date(a.date));

                    // Reset form
                    document.getElementById('photo-bf').value = '';
                    document.getElementById('photo-weight').value = '';
                    fileInput.value = '';

                    this.renderGallery();
                }
            });
        },

        renderGallery() {
            const grid = document.getElementById('gallery-grid');

            if (this.state.photos.length === 0) {
                grid.innerHTML = `<div style="grid-column: span 2; color:var(--text-muted); font-size:0.8rem; text-align:center; padding: 2rem 0;">Nenhuma foto salva. Não tenha medo de registrar o antes!</div>`;
                grid.style.display = 'block';
                return;
            } else {
                grid.style.display = 'grid';
            }

            grid.innerHTML = this.state.photos.map(p => `
                <div style="background:var(--bg-dark); border-radius:12px; overflow:hidden; border:1px solid var(--glass-border); display:flex; flex-direction:column;">
                    <div style="height: 200px; width: 100%; overflow: hidden; background: #000;">
                        <img src="${p.url}" style="width: 100%; height: 100%; object-fit: cover; opacity: 0.9;" alt="Evolução BF">
                    </div>
                    <div style="padding: 0.8rem;">
                        <div style="font-size: 0.8rem; color: var(--primary); font-weight: bold; margin-bottom: 0.2rem;"><i class="fa-regular fa-calendar"></i> ${p.date}</div>
                        <div style="display:flex; justify-content: space-between; font-size: 0.85rem;">
                            <span><i class="fa-solid fa-percent" style="color:var(--text-muted)"></i> BF: <strong>${p.bf}${p.bf !== '?' ? '%' : ''}</strong></span>
                            <span><i class="fa-solid fa-weight-scale" style="color:var(--text-muted)"></i> <strong>${p.weight}${p.weight !== '?' ? 'kg' : ''}</strong></span>
                        </div>
                    </div>
                </div>
            `).join('');
        }
    };

    window.PhotoModule = PhotoModule;

})();
