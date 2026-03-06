/**
 * Fitness Journey MED - Progress Photos Module
 */

(function () {
    'use strict';

    const PhotoModule = {
        state: {
            staging: null,
            entries: [
                {
                    title: 'Início do Acompanhamento',
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
                    <h5 style="margin-bottom: 0.5rem;">Adicionar Novas Fotos</h5>
                    
                    <div style="display:flex; flex-direction: column; gap: 0.5rem; margin-top: 1rem; margin-bottom: 1rem;">
                        <input type="text" id="photo-title" class="form-control" placeholder='Ex: "Término da Quaresma" ou "Fim do Bulking"'>
                        <input type="date" id="photo-date" class="form-control" style="padding: 0.5rem; color: var(--text-muted);" value="${new Date().toISOString().split('T')[0]}">
                    </div>

                    <button class="btn btn-primary" id="btn-upload-photo" style="padding: 0.5rem 2rem;">
                        <i class="fa-solid fa-camera"></i> Escolher Fotos (Análise IA)
                    </button>
                    <input type="file" id="file-input" accept="image/*" multiple style="display: none;">
                    
                    <div id="photo-ai-loading" style="display:none; text-align:center; margin-top:1.5rem; color: var(--primary-light);">
                        <i class="fa-solid fa-robot fa-bounce"></i> IA escaneando composição corporal (Cálculo de BF e Peso)...
                    </div>
                    
                    <div id="photo-staging" style="display:none; margin-top: 1rem; text-align: left;">
                    </div>
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
                const files = e.target.files;
                if (files && files.length > 0) {
                    const date = document.getElementById('photo-date').value;
                    const title = document.getElementById('photo-title').value.trim() || 'Avaliação Física';

                    document.getElementById('photo-ai-loading').style.display = 'block';
                    document.getElementById('btn-upload-photo').disabled = true;

                    // Simulate AI Processing (2s delay)
                    setTimeout(() => {
                        // Mock AI generated baseline for this batch
                        const baseWeight = 80 + (Math.random() * 2 - 1);
                        const baseBf = 14 + (Math.random() * 3 - 1.5);

                        const stagedImages = [];

                        Array.from(files).forEach(file => {
                            const url = URL.createObjectURL(file);

                            // Slight variance per photo for the prototype effect
                            const imgBf = baseBf + (Math.random() * 0.4 - 0.2);
                            const imgWeight = baseWeight + (Math.random() * 0.2 - 0.1);

                            stagedImages.push({
                                bf: parseFloat(imgBf.toFixed(1)),
                                weight: parseFloat(imgWeight.toFixed(1)),
                                url: url
                            });
                        });

                        this.state.staging = {
                            title: title,
                            date: date,
                            images: stagedImages
                        };

                        document.getElementById('photo-ai-loading').style.display = 'none';
                        this.renderStaging();

                    }, 2000);
                }
            });
        },

        renderStaging() {
            const stagingDiv = document.getElementById('photo-staging');
            if (!this.state.staging) {
                stagingDiv.style.display = 'none';
                return;
            }

            const imgCount = this.state.staging.images.length;
            stagingDiv.style.display = 'block';
            stagingDiv.innerHTML = `
                <div style="font-size: 0.85rem; color: var(--primary); margin-bottom: 0.8rem; text-align: center;">
                    <i class="fa-solid fa-check-circle"></i> Análise concluída. ${imgCount} foto(s) prontas.
                </div>
                <button class="btn btn-primary" id="btn-save-record" style="width: 100%; padding: 0.8rem;">
                    <i class="fa-solid fa-floppy-disk"></i> Salvar Registro Clínico
                </button>
                <button class="btn mt-2" id="btn-cancel-staging" style="width: 100%; padding: 0.5rem; background: transparent; border: 1px solid var(--glass-border); color: var(--text-muted);">Cancelar</button>
            `;

            document.getElementById('btn-save-record').addEventListener('click', () => {
                const s = this.state.staging;
                let entry = this.state.entries.find(e => e.date === s.date);
                if (!entry) {
                    entry = { title: s.title, date: s.date, images: [] };
                    this.state.entries.push(entry);
                } else if (s.title !== 'Avaliação Física') {
                    entry.title = s.title; // Update title if provided
                }

                entry.images.push(...s.images);

                // Sort by date descending
                this.state.entries.sort((a, b) => new Date(b.date) - new Date(a.date));

                // Reset
                this.state.staging = null;
                document.getElementById('photo-title').value = '';
                document.getElementById('file-input').value = '';
                document.getElementById('btn-upload-photo').disabled = false;

                this.renderStaging();
                this.renderGallery();
            });

            document.getElementById('btn-cancel-staging').addEventListener('click', () => {
                this.state.staging = null;
                document.getElementById('file-input').value = '';
                document.getElementById('btn-upload-photo').disabled = false;
                this.renderStaging();
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
                    <div style="padding: 1rem; border-bottom: 1px solid var(--glass-border); display:flex; justify-content: space-between; align-items: start;">
                        <div>
                            <strong style="color:var(--text-main); display:block; margin-bottom: 0.2rem;">${entry.title || 'Avaliação Física'}</strong>
                            <span style="color: var(--primary); font-size:0.8rem;"><i class="fa-regular fa-calendar" style="margin-right: 3px;"></i> ${entry.date}</span>
                        </div>
                        <span style="font-size: 0.8rem; color: var(--text-muted); padding-top: 2px;">${imageCount} foto(s)</span>
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
