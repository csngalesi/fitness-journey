/**
 * Fitness Journey MED - Progress Photos Module
 */

(function () {
    'use strict';

    const PhotoModule = {
        state: {
            staging: null,
            entries: [],
            profile: null
        },

        async render() {
            const container = document.getElementById('photo-content-area');
            container.innerHTML = `<p style="text-align:center; color: var(--text-muted);"><i class="fa-solid fa-spinner fa-spin"></i> Baixando galeria sincronizada com a nuvem...</p>`;

            try {
                const { data: { user } } = await window.supabaseClient.auth.getUser();
                if (user) {
                    // Fetch gallery + profile (for AI context)
                    const [logsRes, profileRes] = await Promise.all([
                        window.supabaseClient
                            .from('evolution_logs').select('*')
                            .eq('user_id', user.id).order('log_date', { ascending: false }),
                        window.supabaseClient
                            .from('profiles').select('height_cm, weight_kg')
                            .eq('id', user.id).single()
                    ]);

                    if (logsRes.data) {
                        this.state.entries = logsRes.data.map(log => ({
                            id:     log.id,
                            title:  log.title,
                            date:   log.log_date,
                            bf:     log.average_bf,
                            weight: log.average_weight,
                            images: (log.photos_urls || []).map(url => ({ url }))
                        }));
                    }
                    this.state.profile = profileRes.data || null;
                }
            } catch (err) {
                console.warn("Could not fetch photo logs:", err);
            }

            container.innerHTML = `
                <!-- Gallery view (default) -->
                <div id="gallery-view">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
                        <h4 style="font-family:var(--font-display); margin:0;">Galeria de Evolução</h4>
                        <button id="btn-show-upload" style="width:40px;height:40px;border-radius:50%;background:var(--primary);border:none;color:#fff;font-size:1.3rem;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.4);">
                            <i class="fa-solid fa-plus"></i>
                        </button>
                    </div>
                    <div id="gallery-list" style="display:flex; flex-direction:column; gap:1.2rem;"></div>
                </div>

                <!-- Upload form (hidden by default) -->
                <div id="upload-view" style="display:none;">
                    <div style="display:flex; align-items:center; gap:0.75rem; margin-bottom:1rem;">
                        <button id="btn-hide-upload" style="background:none;border:none;color:var(--text-muted);font-size:1.1rem;cursor:pointer;padding:0;">
                            <i class="fa-solid fa-arrow-left"></i>
                        </button>
                        <h4 style="font-family:var(--font-display); margin:0;">Adicionar Fotos</h4>
                    </div>

                    <div style="background:var(--bg-dark); padding:1rem; border-radius:12px; border:1px dashed var(--primary); text-align:center;">
                        <i class="fa-solid fa-cloud-arrow-up" style="font-size:2rem; color:var(--primary); margin-bottom:0.5rem;"></i>

                        <div style="display:flex; flex-direction:column; gap:0.5rem; margin-top:1rem; margin-bottom:1rem;">
                            <input type="text" id="photo-title" class="form-control" placeholder='Ex: "Término da Quaresma" ou "Fim do Bulking"'>
                            <input type="date" id="photo-date" class="form-control" style="padding:0.5rem; color:var(--text-muted);" value="${new Date().toISOString().split('T')[0]}">
                        </div>

                        <button class="btn btn-primary" id="btn-upload-photo" style="padding:0.5rem 2rem;">
                            <i class="fa-solid fa-camera"></i> Escolher Fotos (Análise IA)
                        </button>
                        <input type="file" id="file-input" accept="image/*" multiple style="display:none;">

                        <div style="margin-top:1rem; padding-top:1rem; border-top:1px solid var(--glass-border);">
                            <button class="btn" id="btn-bulk-import" style="width:100%;background:transparent;border:1px solid var(--glass-border);color:var(--text-muted);padding:0.5rem;">
                                <i class="fa-solid fa-folder-open"></i> Importar Histórico (pasta de fotos)
                            </button>
                            <input type="file" id="bulk-file-input" accept="image/*" multiple webkitdirectory style="display:none;">
                        </div>

                        <div id="photo-staging" style="display:none; margin-top:1rem; text-align:left;"></div>
                    </div>
                </div>

                <!-- Bulk import progress view -->
                <div id="bulk-view" style="display:none;">
                    <div style="display:flex; align-items:center; gap:0.75rem; margin-bottom:1rem;">
                        <h4 style="font-family:var(--font-display); margin:0;">Importação em Massa</h4>
                    </div>
                    <div id="bulk-progress"></div>
                </div>
            `;

            // Lightbox overlay with zoom + pan (single instance)
            if (!document.getElementById('fj-lightbox')) {
                const lb = document.createElement('div');
                lb.id = 'fj-lightbox';
                lb.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(0,0,0,0.92);z-index:9999;justify-content:center;align-items:center;user-select:none;overflow:hidden;';
                lb.innerHTML = '<img id="fj-lightbox-img" style="max-width:95vw;max-height:92vh;object-fit:contain;border-radius:8px;box-shadow:0 8px 40px rgba(0,0,0,0.8);cursor:zoom-in;transform-origin:center;will-change:transform;">';

                const img = lb.querySelector('#fj-lightbox-img');
                const SCALES = [1, 2, 3.5];
                let scale = 1, tx = 0, ty = 0, drag = null, moved = false;

                function applyT() {
                    img.style.transform = `translate(${tx}px,${ty}px) scale(${scale})`;
                    img.style.cursor = scale > 1 ? 'grab' : 'zoom-in';
                }

                // Open (called externally) — resets state
                lb._open = (url) => {
                    scale = 1; tx = 0; ty = 0;
                    img.src = url;
                    img.style.transform = '';
                    img.style.cursor = 'zoom-in';
                    lb.style.display = 'flex';
                };

                // Click image: cycle zoom levels
                img.addEventListener('click', (e) => {
                    if (moved) { moved = false; return; }
                    e.stopPropagation();
                    const i = SCALES.indexOf(scale);
                    scale = SCALES[(i + 1) % SCALES.length];
                    if (scale === 1) { tx = 0; ty = 0; }
                    applyT();
                });

                // Mouse drag to pan when zoomed
                lb.addEventListener('mousedown', (e) => {
                    if (e.target !== img || scale <= 1) return;
                    drag = { sx: e.clientX - tx, sy: e.clientY - ty };
                    moved = false;
                    img.style.cursor = 'grabbing';
                    e.preventDefault();
                });
                lb.addEventListener('mousemove', (e) => {
                    if (!drag) return;
                    const nx = e.clientX - drag.sx, ny = e.clientY - drag.sy;
                    if (Math.abs(nx - tx) > 3 || Math.abs(ny - ty) > 3) moved = true;
                    tx = nx; ty = ny;
                    applyT();
                });
                lb.addEventListener('mouseup', () => { drag = null; applyT(); });

                // Scroll wheel zoom
                lb.addEventListener('wheel', (e) => {
                    e.preventDefault();
                    scale = Math.min(6, Math.max(1, scale * (e.deltaY < 0 ? 1.15 : 0.87)));
                    if (scale <= 1.05) { scale = 1; tx = 0; ty = 0; }
                    applyT();
                }, { passive: false });

                // Click dark background: close
                lb.addEventListener('click', (e) => {
                    if (e.target === img) return;
                    scale = 1; tx = 0; ty = 0;
                    lb.style.display = 'none';
                });

                document.body.appendChild(lb);
            }

            this.bindEvents();
            this.renderGallery();
        },

        // Resize image to max 800px and return {base64, mimeType}
        async _resizeImage(file, maxPx = 800) {
            return new Promise((resolve) => {
                const img = new Image();
                const url = URL.createObjectURL(file);
                img.onload = () => {
                    URL.revokeObjectURL(url);
                    const ratio = Math.min(maxPx / img.width, maxPx / img.height, 1);
                    const canvas = document.createElement('canvas');
                    canvas.width  = Math.round(img.width  * ratio);
                    canvas.height = Math.round(img.height * ratio);
                    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
                    resolve({
                        base64:   dataUrl.split(',')[1],
                        mimeType: 'image/jpeg',
                        previewUrl: dataUrl
                    });
                };
                img.src = url;
            });
        },

        async _analyzeImage(base64, mimeType) {
            const body = { imageBase64: base64, mimeType };
            if (this.state.profile?.height_cm)  body.height_cm       = this.state.profile.height_cm;
            if (this.state.profile?.weight_kg)   body.weight_kg_last  = this.state.profile.weight_kg;

            const resp = await fetch('/api/analyze-photo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            if (!resp.ok) throw new Error('Erro na análise visual pela IA');
            return resp.json(); // { bf, weight, notes }
        },

        _showBulk() {
            document.getElementById('upload-view').style.display  = 'none';
            document.getElementById('gallery-view').style.display = 'none';
            document.getElementById('bulk-view').style.display    = 'block';
        },

        _parseDateFromFilename(filename) {
            // IMG-20221128-WA0063.jpg → 2022-11-28
            const m = filename.match(/(\d{4})(\d{2})(\d{2})/);
            if (m && parseInt(m[1]) >= 2000 && parseInt(m[1]) <= 2035) {
                return `${m[1]}-${m[2]}-${m[3]}`;
            }
            return new Date().toISOString().split('T')[0];
        },

        _renderBulkProgress(groups) {
            const el = document.getElementById('bulk-progress');
            if (!el) return;
            const allDone  = groups.every(g => g.status === 'done' || g.status === 'error');
            const doneCount = groups.filter(g => g.status === 'done').length;

            const rows = groups.map(g => {
                let s = '';
                if (g.status === 'pending')   s = `<span style="color:var(--text-muted);font-size:.78rem;">Aguardando</span>`;
                if (g.status === 'analyzing') s = `<span style="color:var(--primary-light);font-size:.78rem;"><i class="fa-solid fa-robot fa-bounce"></i> foto ${g.current}/${g.total}</span>`;
                if (g.status === 'uploading') s = `<span style="color:var(--primary-light);font-size:.78rem;"><i class="fa-solid fa-cloud-arrow-up fa-bounce"></i> salvando</span>`;
                if (g.status === 'done')      s = `<span style="color:#4ade80;font-size:.78rem;"><i class="fa-solid fa-check"></i> ${g.avgBf != null ? g.avgBf+'% BF' : '—'}${g.avgWeight != null ? ' · '+g.avgWeight+'kg' : ''}</span>`;
                if (g.status === 'error')     s = `<span style="color:var(--primary);font-size:.78rem;"><i class="fa-solid fa-xmark"></i> erro</span>`;
                return `<div style="display:flex;justify-content:space-between;align-items:center;padding:.45rem 0;border-bottom:1px solid var(--glass-border);">
                    <div>
                        <span style="font-size:.85rem;font-weight:600;color:var(--text-main);">${g.date}</span>
                        <span style="font-size:.72rem;color:var(--text-muted);margin-left:.4rem;">${g.total} foto(s)</span>
                    </div>
                    ${s}
                </div>`;
            }).join('');

            el.innerHTML = `
                <div style="font-size:.82rem;color:var(--text-muted);margin-bottom:.75rem;">
                    ${allDone
                        ? `<i class="fa-solid fa-circle-check" style="color:#4ade80;"></i> Concluído — ${doneCount} de ${groups.length} grupos salvos`
                        : `<i class="fa-solid fa-spinner fa-spin" style="color:var(--primary);"></i> Processando ${groups.length} grupos de datas...`}
                </div>
                <div style="max-height:55vh;overflow-y:auto;">${rows}</div>
                ${allDone ? `<button class="btn btn-primary mt-3" id="btn-bulk-done" style="width:100%;padding:.8rem;"><i class="fa-solid fa-images"></i> Ver Galeria</button>` : ''}
            `;
            if (allDone) {
                document.getElementById('btn-bulk-done').addEventListener('click', () => this.render());
            }
        },

        async _bulkImport(files) {
            // Group files by date parsed from filename
            const grouped = {};
            for (const file of files) {
                const date = this._parseDateFromFilename(file.name);
                if (!grouped[date]) grouped[date] = [];
                grouped[date].push(file);
            }

            const groups = Object.keys(grouped).sort().map(date => ({
                date, files: grouped[date], status: 'pending',
                current: 0, total: grouped[date].length, avgBf: null, avgWeight: null,
            }));

            this._showBulk();
            this._renderBulkProgress(groups);

            const { data: { user } } = await window.supabaseClient.auth.getUser();

            for (const group of groups) {
                group.status = 'analyzing';
                this._renderBulkProgress(groups);

                const results = [];
                for (const file of group.files) {
                    group.current++;
                    this._renderBulkProgress(groups);
                    try {
                        const { base64, mimeType } = await this._resizeImage(file);
                        const result = await this._analyzeImage(base64, mimeType);
                        results.push({ file, bf: result.bf, weight: result.weight });
                    } catch {
                        results.push({ file, bf: null, weight: null });
                    }
                }

                group.status = 'uploading';
                this._renderBulkProgress(groups);

                try {
                    const publicUrls = [];
                    for (const r of results) {
                        const ext  = r.file.name.split('.').pop();
                        const path = `${user.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
                        const { error } = await window.supabaseClient.storage.from('evolution_photos').upload(path, r.file);
                        if (!error) {
                            const { data: u } = window.supabaseClient.storage.from('evolution_photos').getPublicUrl(path);
                            publicUrls.push(u.publicUrl);
                        }
                    }

                    const bfs = results.map(r => r.bf).filter(v => v != null);
                    const wts = results.map(r => r.weight).filter(v => v != null);
                    const avgBf     = bfs.length ? parseFloat((bfs.reduce((a,b)=>a+b,0)/bfs.length).toFixed(1)) : null;
                    const avgWeight = wts.length ? parseFloat((wts.reduce((a,b)=>a+b,0)/wts.length).toFixed(1)) : null;

                    await window.supabaseClient.from('evolution_logs').insert([{
                        user_id: user.id, log_date: group.date,
                        title: `Importação ${group.date}`,
                        average_bf: avgBf, average_weight: avgWeight, photos_urls: publicUrls,
                    }]);

                    group.status   = 'done';
                    group.avgBf    = avgBf;
                    group.avgWeight = avgWeight;
                } catch (err) {
                    console.error(`[bulk] ${group.date}:`, err);
                    group.status = 'error';
                }

                this._renderBulkProgress(groups);
            }
        },

        _showUpload() {
            document.getElementById('gallery-view').style.display = 'none';
            document.getElementById('upload-view').style.display  = 'block';
        },

        _showGallery() {
            document.getElementById('upload-view').style.display  = 'none';
            document.getElementById('gallery-view').style.display = 'block';
        },

        bindEvents() {
            // Toggle upload form
            document.getElementById('btn-show-upload').addEventListener('click', () => this._showUpload());
            document.getElementById('btn-hide-upload').addEventListener('click', () => {
                this.state.staging = null;
                document.getElementById('file-input').value = '';
                this.renderStaging();
                this._showGallery();
            });

            // Gallery — delegated click: action buttons first, then lightbox
            document.getElementById('gallery-list').addEventListener('click', async (e) => {
                const btn = e.target.closest('[data-action]');
                if (btn) {
                    const { action, id, url } = btn.dataset;
                    if (action === 'delete-photo')  await this._deletePhoto(id, url);
                    else if (action === 'delete-record') await this._deleteRecord(id);
                    else if (action === 'edit-record')   this._editRecord(id);
                    else if (action === 'cancel-edit')   this._cancelEdit(id);
                    else if (action === 'save-edit')     await this._saveEditRecord(id);
                    else if (action === 'rerun-bf')      await this._rerunBF(id);
                    return;
                }
                const imgEl = e.target.closest('[data-zoom]');
                if (imgEl) document.getElementById('fj-lightbox')._open(imgEl.dataset.zoom);
            });

            // Bulk import
            document.getElementById('btn-bulk-import').addEventListener('click', () =>
                document.getElementById('bulk-file-input').click()
            );
            document.getElementById('bulk-file-input').addEventListener('change', (e) => {
                const files = Array.from(e.target.files);
                if (files.length > 0) this._bulkImport(files);
            });

            const btnUpload = document.getElementById('btn-upload-photo');
            const fileInput = document.getElementById('file-input');

            btnUpload.addEventListener('click', () => fileInput.click());

            fileInput.addEventListener('change', async (e) => {
                const files = e.target.files;
                if (!files || files.length === 0) return;

                const date  = document.getElementById('photo-date').value;
                const title = document.getElementById('photo-title').value.trim() || 'Avaliação Física';

                // Show loading staging immediately
                this.state.staging = {
                    title, date,
                    images: Array.from(files).map(file => ({
                        file, bf: null, weight: null, notes: '', url: URL.createObjectURL(file), analyzing: true
                    }))
                };
                this.renderStaging();

                // Analyze each photo with Gemini Vision
                for (let i = 0; i < this.state.staging.images.length; i++) {
                    try {
                        const { base64, mimeType, previewUrl } = await this._resizeImage(files[i]);
                        this.state.staging.images[i].url = previewUrl; // use compressed preview
                        const result = await this._analyzeImage(base64, mimeType);
                        this.state.staging.images[i].bf     = result.bf;
                        this.state.staging.images[i].weight = result.weight;
                        this.state.staging.images[i].notes  = result.notes;
                    } catch (err) {
                        console.warn(`[photo] AI analysis failed for image ${i}:`, err);
                    }
                    this.state.staging.images[i].analyzing = false;
                    this.renderStaging(); // re-render with result
                }
            });
        },

        renderStaging() {
            const stagingDiv = document.getElementById('photo-staging');
            if (!this.state.staging) {
                stagingDiv.style.display = 'none';
                return;
            }

            stagingDiv.style.display = 'block';

            const photoRows = this.state.staging.images.map((img) => {
                if (img.analyzing) {
                    return `
                    <div style="display:flex; gap:0.5rem; align-items:center; padding:0.6rem 0; border-bottom:1px solid var(--glass-border);">
                        <img src="${img.url}" style="width:48px; height:48px; object-fit:cover; border-radius:6px; flex-shrink:0; opacity:0.5;">
                        <div style="flex:1; color:var(--primary-light); font-size:0.82rem;">
                            <i class="fa-solid fa-robot fa-bounce"></i> IA analisando composição corporal...
                        </div>
                    </div>`;
                }
                const bfTag     = img.bf     != null ? `<span style="background:var(--primary); color:#fff; padding:2px 8px; border-radius:10px; font-size:0.78rem; font-weight:700;">${img.bf}% BF</span>`     : '';
                const weightTag = img.weight != null ? `<span style="background:var(--bg-card); color:var(--text-main); padding:2px 8px; border-radius:10px; font-size:0.78rem; border:1px solid var(--glass-border);">${img.weight} kg</span>` : '';
                const notesHtml = img.notes ? `<div style="font-size:0.72rem; color:var(--text-muted); margin-top:4px;">${img.notes}</div>` : '';
                return `
                <div style="display:flex; gap:0.5rem; align-items:flex-start; padding:0.6rem 0; border-bottom:1px solid var(--glass-border);">
                    <img src="${img.url}" style="width:48px; height:48px; object-fit:cover; border-radius:6px; flex-shrink:0;">
                    <div style="flex:1;">
                        <div style="display:flex; gap:0.4rem; flex-wrap:wrap; align-items:center;">
                            ${bfTag} ${weightTag}
                            ${!bfTag && !weightTag ? '<span style="font-size:0.78rem; color:var(--text-muted);">IA não identificou valores</span>' : ''}
                        </div>
                        ${notesHtml}
                    </div>
                </div>`;
            }).join('');

            const allDone = this.state.staging.images.every(img => !img.analyzing);

            // Compute session averages for preview
            let avgSummary = '';
            if (allDone) {
                const validBf     = this.state.staging.images.map(i => i.bf).filter(v => v !== null);
                const validWeight = this.state.staging.images.map(i => i.weight).filter(v => v !== null);
                const avgBf     = validBf.length     ? (validBf.reduce((a, b) => a + b, 0)     / validBf.length).toFixed(1)     : null;
                const avgWeight = validWeight.length ? (validWeight.reduce((a, b) => a + b, 0) / validWeight.length).toFixed(1) : null;
                if (avgBf || avgWeight) {
                    avgSummary = `
                    <div style="background:rgba(255,65,108,0.08); border:1px solid var(--primary-light); border-radius:8px; padding:0.7rem 1rem; margin-top:0.8rem; display:flex; justify-content:space-around;">
                        ${avgBf     ? `<div style="text-align:center;"><div style="font-size:0.7rem; color:var(--text-muted); text-transform:uppercase; margin-bottom:3px;">Média BF</div><strong style="color:var(--primary);">${avgBf}%</strong></div>` : ''}
                        ${avgWeight ? `<div style="text-align:center;"><div style="font-size:0.7rem; color:var(--text-muted); text-transform:uppercase; margin-bottom:3px;">Média Peso</div><strong style="color:var(--text-main);">${avgWeight} kg</strong></div>` : ''}
                    </div>`;
                }
            }

            stagingDiv.innerHTML = `
                <div style="font-size:0.8rem; color:var(--text-muted); margin-bottom:0.4rem;">
                    <i class="fa-solid fa-robot" style="color:var(--primary);"></i> Análise de composição corporal pela IA:
                </div>
                ${photoRows}
                ${avgSummary}
                ${allDone ? `
                <button class="btn btn-primary mt-3" id="btn-save-record" style="width:100%; padding:0.8rem;">
                    <i class="fa-solid fa-floppy-disk"></i> Salvar Registro Clínico
                </button>
                <button class="btn mt-2" id="btn-cancel-staging" style="width:100%; padding:0.5rem; background:transparent; border:1px solid var(--glass-border); color:var(--text-muted);">Cancelar</button>
                ` : `<p style="text-align:center; color:var(--text-muted); font-size:0.8rem; margin-top:0.8rem;">Aguardando análise das fotos...</p>`}
            `;

            if (allDone) {
                document.getElementById('btn-save-record').addEventListener('click', async () => {
                    const s = this.state.staging;
                    const btnSave = document.getElementById('btn-save-record');
                    btnSave.disabled = true;
                    btnSave.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Armazenando...';

                    try {
                        const { data: { user } } = await window.supabaseClient.auth.getUser();
                        if (!user) throw new Error("Usuário não logado");

                        // Upload images to Supabase Storage
                        const publicUrls = [];
                        for (const img of s.images) {
                            const fileExt = img.file.name.split('.').pop();
                            const fileName = `${user.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

                            const { error: uploadError } = await window.supabaseClient.storage
                                .from('evolution_photos').upload(fileName, img.file);
                            if (uploadError) throw uploadError;

                            const { data: urlData } = window.supabaseClient.storage
                                .from('evolution_photos').getPublicUrl(fileName);
                            publicUrls.push(urlData.publicUrl);
                        }

                        // Compute averages
                        const validBf     = s.images.map(i => i.bf).filter(v => v !== null);
                        const validWeight = s.images.map(i => i.weight).filter(v => v !== null);
                        const avgBf     = validBf.length     ? parseFloat((validBf.reduce((a, b) => a + b, 0)     / validBf.length).toFixed(1))     : null;
                        const avgWeight = validWeight.length ? parseFloat((validWeight.reduce((a, b) => a + b, 0) / validWeight.length).toFixed(1)) : null;

                        const { error: dbError } = await window.supabaseClient
                            .from('evolution_logs').insert([{
                                user_id: user.id,
                                log_date: s.date,
                                title: s.title,
                                average_bf: avgBf,
                                average_weight: avgWeight,
                                photos_urls: publicUrls
                            }]);
                        if (dbError) throw dbError;

                        this.state.staging = null;
                        document.getElementById('photo-title').value = '';
                        document.getElementById('file-input').value = '';
                        document.getElementById('btn-upload-photo').disabled = false;
                        await this.render();
                    } catch (err) {
                        alert("Erro ao salvar fotos: " + err.message);
                        btnSave.disabled = false;
                        btnSave.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Salvar Registro Clínico';
                    }
                });

                document.getElementById('btn-cancel-staging').addEventListener('click', () => {
                    this.state.staging = null;
                    document.getElementById('file-input').value = '';
                    document.getElementById('btn-upload-photo').disabled = false;
                    this.renderStaging();
                    this._showGallery();
                });
            }
        },

        renderGallery() {
            const list = document.getElementById('gallery-list');

            if (this.state.entries.length === 0) {
                list.innerHTML = `<div style="color:var(--text-muted); font-size:0.8rem; text-align:center; padding: 2rem 0;">Nenhuma foto salva. Não tenha medo de registrar o antes!</div>`;
                return;
            }

            const iconBtn = (action, id, icon, title, extra = '') =>
                `<button data-action="${action}" data-id="${id}" ${extra} title="${title}"
                    style="background:rgba(255,255,255,0.08); border:none; color:var(--text-muted); border-radius:6px; width:30px; height:30px; cursor:pointer; font-size:12px; display:flex; align-items:center; justify-content:center;">
                    <i class="fa-solid fa-${icon}"></i></button>`;

            list.innerHTML = this.state.entries.map(entry => {
                const avgBf     = entry.bf     != null ? entry.bf     : '?';
                const avgWeight = entry.weight != null ? entry.weight : '?';
                const imageCount = entry.images.length;
                const gridCols   = Math.min(imageCount, 3);

                return `
                <div style="background:var(--bg-dark); border-radius:12px; overflow:hidden; border:1px solid var(--glass-border);">
                    <div style="padding: 0.75rem 1rem; border-bottom: 1px solid var(--glass-border); display:flex; justify-content: space-between; align-items: center; gap:8px;">
                        <div style="min-width:0;">
                            <strong style="color:var(--text-main); display:block; margin-bottom: 0.15rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${entry.title || 'Avaliação Física'}</strong>
                            <span style="color: var(--primary); font-size:0.78rem;"><i class="fa-regular fa-calendar" style="margin-right: 3px;"></i>${entry.date}</span>
                        </div>
                        <div style="display:flex; gap:5px; flex-shrink:0;">
                            ${iconBtn('rerun-bf',      entry.id, 'robot',  'Re-analisar BF com IA')}
                            ${iconBtn('edit-record',   entry.id, 'pencil', 'Editar registro')}
                            ${iconBtn('delete-record', entry.id, 'trash',  'Excluir registro')}
                        </div>
                    </div>

                    <div style="display:grid; grid-template-columns: repeat(${gridCols}, 1fr); gap: 2px; background: #000;">
                        ${entry.images.map(img => `
                            <div style="position:relative; aspect-ratio: 1/1; overflow:hidden;">
                                <img src="${img.url}" data-zoom="${img.url}" style="width: 100%; height: 100%; object-fit: cover; opacity: 0.9; cursor:zoom-in;" alt="Evolução">
                                <button data-action="delete-photo" data-id="${entry.id}" data-url="${img.url}"
                                    style="position:absolute; top:4px; right:4px; background:rgba(0,0,0,0.65); color:#fff; border:none; border-radius:50%; width:26px; height:26px; cursor:pointer; font-size:11px; display:flex; align-items:center; justify-content:center; padding:0;">
                                    <i class="fa-solid fa-trash"></i>
                                </button>
                            </div>
                        `).join('')}
                    </div>

                    <div style="padding: 0.75rem 1rem; background: var(--bg-card); display:flex; justify-content: space-around; font-size: 0.9rem;">
                        <div style="text-align:center;">
                            <div style="color:var(--text-muted); font-size: 0.72rem; text-transform:uppercase; letter-spacing:1px; margin-bottom:0.2rem;">Média BF</div>
                            <strong><i class="fa-solid fa-percent" style="color:var(--primary); font-size:0.8rem; margin-right:3px;"></i>${avgBf}${avgBf !== '?' ? '%' : ''}</strong>
                        </div>
                        <div style="width: 1px; background: var(--glass-border);"></div>
                        <div style="text-align:center;">
                            <div style="color:var(--text-muted); font-size: 0.72rem; text-transform:uppercase; letter-spacing:1px; margin-bottom:0.2rem;">Média Peso</div>
                            <strong><i class="fa-solid fa-weight-scale" style="color:var(--primary); font-size:0.8rem; margin-right:3px;"></i>${avgWeight}${avgWeight !== '?' ? 'kg' : ''}</strong>
                        </div>
                    </div>

                    <!-- Inline edit form (hidden by default) -->
                    <div id="edit-form-${entry.id}" style="display:none; padding:1rem; border-top:1px solid var(--glass-border); background:var(--bg-card);">
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.5rem; margin-bottom:0.5rem;">
                            <div style="grid-column:1/-1;">
                                <label style="font-size:0.72rem; color:var(--text-muted); display:block; margin-bottom:3px;">Título</label>
                                <input type="text" id="ef-title-${entry.id}" value="${(entry.title || '').replace(/"/g,'&quot;')}"
                                    style="width:100%; box-sizing:border-box; padding:5px 8px; border-radius:6px; background:var(--bg-dark); border:1px solid var(--glass-border); color:var(--text-main); font-size:0.82rem;">
                            </div>
                            <div>
                                <label style="font-size:0.72rem; color:var(--text-muted); display:block; margin-bottom:3px;">Data</label>
                                <input type="date" id="ef-date-${entry.id}" value="${entry.date}"
                                    style="width:100%; box-sizing:border-box; padding:5px 8px; border-radius:6px; background:var(--bg-dark); border:1px solid var(--glass-border); color:var(--text-main); font-size:0.82rem;">
                            </div>
                            <div></div>
                            <div>
                                <label style="font-size:0.72rem; color:var(--text-muted); display:block; margin-bottom:3px;">BF %</label>
                                <input type="number" id="ef-bf-${entry.id}" value="${entry.bf ?? ''}" step="0.1"
                                    style="width:100%; box-sizing:border-box; padding:5px 8px; border-radius:6px; background:var(--bg-dark); border:1px solid var(--glass-border); color:var(--text-main); font-size:0.82rem;">
                            </div>
                            <div>
                                <label style="font-size:0.72rem; color:var(--text-muted); display:block; margin-bottom:3px;">Peso kg</label>
                                <input type="number" id="ef-weight-${entry.id}" value="${entry.weight ?? ''}" step="0.1"
                                    style="width:100%; box-sizing:border-box; padding:5px 8px; border-radius:6px; background:var(--bg-dark); border:1px solid var(--glass-border); color:var(--text-main); font-size:0.82rem;">
                            </div>
                        </div>
                        <div style="display:flex; gap:0.5rem;">
                            <button data-action="save-edit" data-id="${entry.id}"
                                style="flex:1; padding:0.5rem; background:var(--primary); color:#fff; border:none; border-radius:6px; cursor:pointer; font-size:0.82rem;">
                                <i class="fa-solid fa-floppy-disk"></i> Salvar
                            </button>
                            <button data-action="cancel-edit" data-id="${entry.id}"
                                style="flex:1; padding:0.5rem; background:transparent; border:1px solid var(--glass-border); color:var(--text-muted); border-radius:6px; cursor:pointer; font-size:0.82rem;">
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
                `;
            }).join('');
        },
    };

        async _imageUrlToBase64(url) {
            const resp = await fetch(url);
            const blob = await resp.blob();
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = () => resolve({ base64: reader.result.split(',')[1], mimeType: blob.type || 'image/jpeg' });
                reader.readAsDataURL(blob);
            });
        },

        async _deletePhoto(entryId, photoUrl) {
            if (!confirm('Remover esta foto do registro?')) return;
            const entry = this.state.entries.find(e => e.id === entryId);
            if (!entry) return;
            const newUrls = entry.images.map(i => i.url).filter(u => u !== photoUrl);
            const { error } = await window.supabaseClient.from('evolution_logs')
                .update({ photos_urls: newUrls }).eq('id', entryId);
            if (error) { alert('Erro ao remover foto: ' + error.message); return; }
            try {
                const match = photoUrl.match(/evolution_photos\/(.+)$/);
                if (match) await window.supabaseClient.storage.from('evolution_photos').remove([match[1]]);
            } catch (e) { console.warn('[photo] storage delete:', e); }
            entry.images = entry.images.filter(i => i.url !== photoUrl);
            this.renderGallery();
        },

        async _deleteRecord(entryId) {
            if (!confirm('Excluir este registro e todas as fotos?')) return;
            const entry = this.state.entries.find(e => e.id === entryId);
            if (!entry) return;
            for (const img of entry.images) {
                try {
                    const match = img.url.match(/evolution_photos\/(.+)$/);
                    if (match) await window.supabaseClient.storage.from('evolution_photos').remove([match[1]]);
                } catch (e) { console.warn('[photo] storage delete:', e); }
            }
            const { error } = await window.supabaseClient.from('evolution_logs').delete().eq('id', entryId);
            if (error) { alert('Erro ao excluir: ' + error.message); return; }
            this.state.entries = this.state.entries.filter(e => e.id !== entryId);
            this.renderGallery();
        },

        _editRecord(entryId) {
            const form = document.getElementById('edit-form-' + entryId);
            if (form) form.style.display = 'block';
        },

        _cancelEdit(entryId) {
            const form = document.getElementById('edit-form-' + entryId);
            if (form) form.style.display = 'none';
        },

        async _saveEditRecord(entryId) {
            const entry = this.state.entries.find(e => e.id === entryId);
            if (!entry) return;
            const title  = document.getElementById('ef-title-'  + entryId)?.value.trim() || 'Avaliação Física';
            const date   = document.getElementById('ef-date-'   + entryId)?.value;
            const bfVal  = document.getElementById('ef-bf-'     + entryId)?.value;
            const wVal   = document.getElementById('ef-weight-' + entryId)?.value;
            const bf     = bfVal ? parseFloat(bfVal)  : null;
            const weight = wVal  ? parseFloat(wVal)   : null;
            const { error } = await window.supabaseClient.from('evolution_logs')
                .update({ title, log_date: date, average_bf: bf, average_weight: weight }).eq('id', entryId);
            if (error) { alert('Erro ao salvar: ' + error.message); return; }
            entry.title  = title;
            entry.date   = date;
            entry.bf     = bf;
            entry.weight = weight;
            this.renderGallery();
        },

        async _rerunBF(entryId) {
            const entry = this.state.entries.find(e => e.id === entryId);
            if (!entry || !entry.images.length) return;
            const btn = document.querySelector(`[data-action="rerun-bf"][data-id="${entryId}"]`);
            if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>'; }
            try {
                const results = [];
                for (const img of entry.images) {
                    try {
                        const { base64, mimeType } = await this._imageUrlToBase64(img.url);
                        results.push(await this._analyzeImage(base64, mimeType));
                    } catch (e) { console.warn('[photo] rerun-bf:', e); }
                }
                const validBf     = results.map(r => r.bf).filter(v => v != null);
                const validWeight = results.map(r => r.weight).filter(v => v != null);
                const avgBf     = validBf.length     ? parseFloat((validBf.reduce((a,b)=>a+b,0)     / validBf.length).toFixed(1))     : null;
                const avgWeight = validWeight.length ? parseFloat((validWeight.reduce((a,b)=>a+b,0) / validWeight.length).toFixed(1)) : null;
                const { error } = await window.supabaseClient.from('evolution_logs')
                    .update({ average_bf: avgBf, average_weight: avgWeight }).eq('id', entryId);
                if (error) throw error;
                entry.bf     = avgBf;
                entry.weight = avgWeight;
                this.renderGallery();
            } catch (err) {
                alert('Erro ao re-analisar: ' + err.message);
                if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-robot"></i>'; }
            }
        },
    };

    window.PhotoModule = PhotoModule;

})();
