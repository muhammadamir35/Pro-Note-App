const notesContainer = document.getElementById("notes-container");
const addNoteBtn = document.getElementById("add-note-btn");
const emptyState = document.getElementById("empty-state");

// Modal Elements
const imageModal = document.getElementById("image-modal");
const modalImg = document.getElementById("modal-img");
const closeModalBtn = document.querySelector(".close-modal");

// Modal Close Logic (Clicking X or clicking outside image)
closeModalBtn.onclick = () => imageModal.style.display = "none";
imageModal.onclick = (e) => {
    if (e.target !== modalImg) {
        imageModal.style.display = "none";
    }
};

const savedNotes = getNotes();
savedNotes.forEach(note => {
    const noteElement = createNoteElement(note);
    notesContainer.appendChild(noteElement);
});

checkEmptyState();
addNoteBtn.addEventListener("click", () => addNote());

function getNotes() { return JSON.parse(localStorage.getItem("pro-note-app") || "[]"); }

function saveNotes(notes) {
    try {
        localStorage.setItem("pro-note-app", JSON.stringify(notes));
        checkEmptyState();
    } catch (e) { alert("Storage Full! Cannot save."); }
}

function checkEmptyState() {
    emptyState.style.display = getNotes().length === 0 ? "block" : "none";
}

function getCurrentDate() {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date().toLocaleDateString('en-US', options);
}

function createNoteElement(noteObj) {
    const noteDiv = document.createElement("div");
    noteDiv.classList.add("note");

    const deleteBtn = document.createElement("button");
    deleteBtn.innerHTML = "&times;";
    deleteBtn.classList.add("delete-btn");

    const headerDiv = document.createElement("div");
    headerDiv.classList.add("note-header");

    const subjectInput = document.createElement("input");
    subjectInput.type = "text";
    subjectInput.classList.add("note-subject");
    subjectInput.placeholder = "Subject...";
    subjectInput.value = noteObj.subject || "";

    const dateSpan = document.createElement("span");
    dateSpan.classList.add("note-date");
    dateSpan.innerText = noteObj.date;

    headerDiv.appendChild(subjectInput);
    headerDiv.appendChild(dateSpan);

    const toolbar = document.createElement("div");
    toolbar.classList.add("toolbar");

    const createBtn = (html, tooltip, command) => {
        const btn = document.createElement("button");
        btn.innerHTML = html;
        btn.title = tooltip;
        btn.onclick = () => document.execCommand(command, false, null);
        return btn;
    };

    const btnBold = createBtn("<b>B</b>", "Bold (Ctrl+B)", "bold");
    const btnItalic = createBtn("<i>I</i>", "Italic (Ctrl+I)", "italic");
    const btnUnderline = createBtn("<u>U</u>", "Underline (Ctrl+U)", "underline");
    const btnUl = createBtn("• List", "Bullet List (Ctrl+Shift+L)", "insertUnorderedList");
    const btnOl = createBtn("1. List", "Numbered List (Ctrl+Shift+O)", "insertOrderedList");

    const fontSizeSelect = document.createElement("select");
    fontSizeSelect.title = "Font Size";
    const sizes = [{ val: 2, text: "Small" }, { val: 3, text: "Normal" }, { val: 5, text: "Large" }, { val: 7, text: "Huge" }];
    sizes.forEach(s => {
        const opt = document.createElement("option");
        opt.value = s.val;
        opt.innerText = s.text;
        if (s.val === 3) opt.selected = true;
        fontSizeSelect.appendChild(opt);
    });
    fontSizeSelect.onchange = (e) => document.execCommand("fontSize", false, e.target.value);

    const colorPicker = document.createElement("input");
    colorPicker.type = "color";
    colorPicker.title = "Text Color";
    colorPicker.oninput = (e) => document.execCommand("foreColor", false, e.target.value);

    toolbar.append(btnBold, btnItalic, btnUnderline, btnUl, btnOl, fontSizeSelect, colorPicker);

    // --- Image Upload & Preview Logic ---
    const imgElement = document.createElement("img");
    imgElement.classList.add("note-image");
    imgElement.title = "Click to preview";

    if (noteObj.image) {
        imgElement.src = noteObj.image;
        imgElement.style.display = "block";
    }

    // Image Click Event (Open Modal)
    imgElement.onclick = () => {
        imageModal.style.display = "flex";
        modalImg.src = imgElement.src;
    };

    const uploadLabel = document.createElement("label");
    uploadLabel.classList.add("upload-label");
    uploadLabel.innerHTML = "📷 Add/Change Image";
    const fileInput = document.createElement("input");
    fileInput.type = "file"; fileInput.accept = "image/*"; fileInput.style.display = "none";
    uploadLabel.appendChild(fileInput);

    const noteBody = document.createElement("div");
    noteBody.classList.add("note-body");
    noteBody.contentEditable = "true";
    noteBody.setAttribute("data-placeholder", "Type your note here...");
    noteBody.innerHTML = noteObj.content || "";

    noteBody.addEventListener("keydown", (e) => {
        if (e.ctrlKey && e.key.toLowerCase() === 'b') { e.preventDefault(); document.execCommand('bold'); }
        if (e.ctrlKey && e.key.toLowerCase() === 'i') { e.preventDefault(); document.execCommand('italic'); }
        if (e.ctrlKey && e.key.toLowerCase() === 'u') { e.preventDefault(); document.execCommand('underline'); }
        if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'l') { e.preventDefault(); document.execCommand('insertUnorderedList'); }
        if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'o') { e.preventDefault(); document.execCommand('insertOrderedList'); }
    });

    const saveBtn = document.createElement("button");
    saveBtn.innerText = "💾 Save Note";
    saveBtn.classList.add("save-btn");
    saveBtn.onclick = () => {
        saveBtn.innerText = "✅ Saved!";
        saveBtn.style.backgroundColor = "#27ae60";
        setTimeout(() => {
            saveBtn.innerText = "💾 Save Note";
            saveBtn.style.backgroundColor = "";
        }, 2000);
    };

    subjectInput.addEventListener("input", () => updateNoteData(noteObj.id, "subject", subjectInput.value));
    noteBody.addEventListener("input", () => updateNoteData(noteObj.id, "content", noteBody.innerHTML));

    fileInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                imgElement.src = event.target.result;
                imgElement.style.display = "block";
                updateNoteData(noteObj.id, "image", event.target.result);
            };
            reader.readAsDataURL(file);
        }
    });

    deleteBtn.addEventListener("click", () => {
        if (confirm("Are you sure you want to delete this note?")) {
            const notes = getNotes().filter(n => n.id !== noteObj.id);
            saveNotes(notes);
            notesContainer.removeChild(noteDiv);
        }
    });

    noteDiv.append(deleteBtn, headerDiv, toolbar, imgElement, uploadLabel, noteBody, saveBtn);

    return noteDiv;
}

function addNote() {
    const notes = getNotes();
    const noteObj = { id: Date.now(), subject: "", content: "", date: getCurrentDate(), image: "" };
    const noteElement = createNoteElement(noteObj);
    notesContainer.insertBefore(noteElement, notesContainer.firstChild);
    notes.unshift(noteObj);
    saveNotes(notes);
}

function updateNoteData(id, field, newValue) {
    const notes = getNotes();
    const targetNote = notes.find(note => note.id === id);
    if (targetNote) { targetNote[field] = newValue; saveNotes(notes); }
}