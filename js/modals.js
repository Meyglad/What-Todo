const settingsModal = document.getElementById("settingsModal");

function openSettingsModal() {
    settingsModal.classList.add("show");
}

function closeSettingsModal() {
    settingsModal.classList.remove("show");
}

export {
    openSettingsModal,
    closeSettingsModal
};