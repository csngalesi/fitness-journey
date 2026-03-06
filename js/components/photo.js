/**
 * Fitness Journey MED - Progress Photos Module
 */

(function () {
    'use strict';

    const PhotoModule = {
        state: {
            entries: [
                {
                    date: '2026-03-01',
                    images: [
                        { bf: 16.5, weight: 80.2, url: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=2120&auto=format&fit=crop' },
                        { bf: 15.5, weight: 79.8, url: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=2070&auto=format&fit=crop' }
                    ]
                }
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
                <div id="gallery-list" style="display:flex; flex-direction:column; gap:1.2rem;">
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

                    const url = URL.createObjectURL(file);

                    let entry = this.state.entries.find(e => e.date === date);
                    if (!entry) {
                        entry = { date: date, images: [] };
                        this.state.entries.push(entry);
                    }

                    entry.images.push({
                        bf: bf ? parseFloat(bf) : null,
                        weight: weight ? parseFloat(weight) : null,
                        url: url
                    });

                    // Sort by date descending
                    this.state.entries.sort((a, b) => new Date(b.date) - new Date(a.date));

                    // Reset form
                    document.getElementById('photo-bf').value = '';
                    document.getElementById('photo-weight').value = '';
                    fileInput.value = '';

                    this.renderGallery();
                }
            });
        },

        renderGallery() {
            const list = document.getElementById('gallery-list');

            if (this.state.entries.length === 0) {
                list.innerHTML = `<div style="color:var(--text-muted); font-size:0.8rem; text-align:center; padding: 2rem 0;">Nenhuma foto salva. Não tenha medo de registrar o antes!</div>`;
                return;
            }

            list.innerHTML = this.state.entries.map(entry => {
                let sumBf = 0, countBf = 0;
                let sumWeight = 0, countWeight = 0;

                entry.images.forEach(img => {
                    if (img.bf !== null && !isNaN(img.bf)) { sumBf += img.bf; countBf++; }
                    if (img.weight !== null && !isNaN(img.weight)) { sumWeight += img.weight; countWeight++; }
                });

                const avgBf = countBf > 0 ? (sumBf / countBf).toFixed(1) : '?';
                const avgWeight = countWeight > 0 ? (sumWeight / countWeight).toFixed(1) : '?';

                const imageCount = entry.images.length;
                const gridCols = Math.min(imageCount, 3);

                return `
                <div style="background:var(--bg-dark); border-radius:12px; overflow:hidden; border:1px solid var(--glass-border);">
                    <div style="padding: 1rem; border-bottom: 1px solid var(--glass-border); display:flex; justify-content: space-between; align-items: center;">
                        <span style="color: var(--primary); font-weight: bold;"><i class="fa-regular fa-calendar" style="margin-right: 5px;"></i> ${entry.date}</span>
                        <span style="font-size: 0.8rem; color: var(--text-muted);">${imageCount} foto(s)</span>
                    </div>
                    
                    <div style="display:grid; grid-template-columns: repeat(${gridCols}, 1fr); gap: 2px; background: #000;">
                        ${entry.images.map(img => `
                            <div style="aspect-ratio: 1/1; overflow:hidden;">
                                <img src="${img.url}" style="width: 100%; height: 100%; object-fit: cover; opacity: 0.9;" alt="Evolução">
                            </div>
                        `).join('')}
                    </div>

                    <div style="padding: 1rem; background: var(--bg-card); display:flex; justify-content: space-around; font-size: 0.9rem;">
                        <div style="text-align:center;">
                            <div style="color:var(--text-muted); font-size: 0.75rem; text-transform:uppercase; letter-spacing:1px; margin-bottom:0.2rem;">Média BF</div>
                            <strong><i class="fa-solid fa-percent" style="color:var(--primary); font-size:0.8rem; margin-right:3px;"></i>${avgBf}${avgBf !== '?' ? '%' : ''}</strong>
                        </div>
                        <div style="width: 1px; background: var(--glass-border);"></div>
                        <div style="text-align:center;">
                            <div style="color:var(--text-muted); font-size: 0.75rem; text-transform:uppercase; letter-spacing:1px; margin-bottom:0.2rem;">Média Peso</div>
                            <strong><i class="fa-solid fa-weight-scale" style="color:var(--primary); font-size:0.8rem; margin-right:3px;"></i>${avgWeight}${avgWeight !== '?' ? 'kg' : ''}</strong>
                        </div>
                    </div>
                </div>
                `;
            }).join('');
        }
    };

    window.PhotoModule = PhotoModule;

})();
