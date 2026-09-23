// js/tou.js — Terms of Use gate for The Cortex Free
// localStorage-based acceptance. Gates the API-key lookup: the TOU must be
// accepted BEFORE any key is transmitted (it covers the "you are giving a
// third-party tool read access with your key" disclosure).

const TOU = {
    STORAGE_KEY: 'cortex_free_tou_accepted_v1',
    TOU_DATE: '2026-09-23',
    TOU_TEXT: `
<p><strong>Terms of Use — The Cortex Free</strong> (v1, 2026-09-23)</p>
<ul>
  <li><strong>What this tool does:</strong> looks up your VORTEX agent's
  public leaderboard position and status. Your API key is sent from
  <em>your browser</em> to our CORS proxy, which forwards it to the VORTEX
  API to identify your agent. It is not stored, logged, or shared.</li>
  <li><strong>Your API key:</strong> giving a third-party tool your key
  grants it the read (and, depending on your key's permissions, write)
  access your key allows. This tool only performs read lookups. If you are
  not comfortable with this, do not use it.</li>
  <li><strong>No warranty:</strong> provided as-is, no guarantee of
  accuracy, availability, or fitness for any purpose. Position and ETA
  estimates may be wrong.</li>
  <li><strong>Your data:</strong> position history is stored in
  <em>your browser's</em> localStorage only. We keep no accounts and no
  server-side data about you.</li>
  <li><strong>Not affiliated:</strong> The Cortex is an independent tool
  built by an Acolyte operator. Not affiliated with or endorsed by
  VORTEX or justentropy.lol.</li>
</ul>`,

    isAccepted() {
        try {
            return localStorage.getItem(this.STORAGE_KEY) === this.TOU_DATE;
        } catch (e) {
            return false; // localStorage unavailable (private mode) — require modal each time
        }
    },

    accept() {
        try {
            localStorage.setItem(this.STORAGE_KEY, this.TOU_DATE);
        } catch (e) {
            /* private mode: acceptance can't persist; session-only via memory flag */
        }
        this._sessionAccepted = true;
    },

    /** True if accepted (persisted OR this-session). */
    gatePasses() {
        return this.isAccepted() || this._sessionAccepted === true;
    },

    /** Show the TOU modal. Returns a Promise<boolean>: true if accepted. */
    show() {
        return new Promise((resolve) => {
            // Remove any existing modal
            const existing = document.getElementById('tou-modal');
            if (existing) existing.remove();

            const modal = document.createElement('div');
            modal.id = 'tou-modal';
            modal.className = 'tou-modal';
            modal.innerHTML = `
                <div class="tou-backdrop"></div>
                <div class="tou-dialog" role="dialog" aria-modal="true" aria-labelledby="tou-title">
                    <h3 id="tou-title">Before you continue</h3>
                    <div class="tou-body">${this.TOU_TEXT}</div>
                    <div class="tou-actions">
                        <button id="tou-accept" class="btn-primary">I accept</button>
                        <button id="tou-decline" class="btn-secondary">Decline</button>
                    </div>
                </div>`;
            document.body.appendChild(modal);

            const close = (accepted) => {
                modal.remove();
                resolve(accepted);
            };
            modal.querySelector('#tou-accept').addEventListener('click', () => {
                this.accept();
                close(true);
            });
            modal.querySelector('#tou-decline').addEventListener('click', () => close(false));
            modal.querySelector('.tou-backdrop').addEventListener('click', () => close(false));
        });
    }
};
