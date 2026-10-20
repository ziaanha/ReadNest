const STORAGE_KEY = "readnest-books-v1";

const bookGrid = document.getElementById("bookGrid");
const emptyState = document.getElementById("emptyState");
const bookDialog = document.getElementById("bookDialog");
const deleteDialog = document.getElementById("deleteDialog");
const bookForm = document.getElementById("bookForm");
const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");
const genreFilter = document.getElementById("genreFilter");
const formError = document.getElementById("formError");
const toast = document.getElementById("toast");

const fields = {
    id: document.getElementById("bookId"),
    title: document.getElementById("bookTitle"),
    author: document.getElementById("bookAuthor"),
    cover: document.getElementById("bookCover"),
    genre: document.getElementById("bookGenre"),
    status: document.getElementById("bookStatus"),
    totalPages: document.getElementById("totalPages"),
    readPages: document.getElementById("readPages"),
    rating: document.getElementById("bookRating")
};

const statusLabels = {
    want: "Want to read",
    reading: "Currently reading",
    completed: "Completed"
};

const defaultBooks = [
    {
        id: "sample-1",
        title: "Pride and Prejudice",
        author: "Jane Austen",
        genre: "Classic",
        status: "completed",
        totalPages: 432,
        readPages: 432,
        rating: 5,
        cover: "https://covers.openlibrary.org/b/isbn/9780141439518-L.jpg",
        createdAt: 1
    },
    {
        id: "sample-2",
        title: "The Little Prince",
        author: "Antoine de Saint-Exupéry",
        genre: "Fiction",
        status: "reading",
        totalPages: 96,
        readPages: 38,
        rating: 0,
        cover: "https://covers.openlibrary.org/b/isbn/9780156012195-L.jpg",
        createdAt: 2
    },
    {
        id: "sample-3",
        title: "The Hobbit",
        author: "J.R.R. Tolkien",
        genre: "Fantasy",
        status: "want",
        totalPages: 310,
        readPages: 0,
        rating: 0,
        cover: "https://covers.openlibrary.org/b/isbn/9780547928227-L.jpg",
        createdAt: 3
    },
    {
        id: "sample-4",
        title: "The Book Thief",
        author: "Markus Zusak",
        genre: "Fiction",
        status: "want",
        totalPages: 584,
        readPages: 0,
        rating: 0,
        cover: "https://covers.openlibrary.org/b/isbn/9780375842207-L.jpg",
        createdAt: 4
    }
];

let books = loadBooks();
let pendingDeleteId = null;
let toastTimeout;

function loadBooks() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);

        if (saved !== null) {
            const parsed = JSON.parse(saved);
            return Array.isArray(parsed)
                ? parsed.filter(isValidStoredBook).map(normalizeBook)
                : [];
        }

        return defaultBooks.map(book => ({ ...book }));
    } catch (error) {
        console.error("Could not load ReadNest library:", error);
        return defaultBooks.map(book => ({ ...book }));
    }
}

function isValidStoredBook(book) {
    return book &&
        typeof book === "object" &&
        typeof book.id === "string" &&
        typeof book.title === "string" &&
        typeof book.author === "string";
}

function normalizeBook(book) {
    const totalPages = Math.max(0, Number(book.totalPages) || 0);
    const readPages = Math.max(0, Number(book.readPages) || 0);
    const validStatus = ["want", "reading", "completed"].includes(book.status)
        ? book.status
        : "want";

    return {
        id: book.id,
        title: book.title.slice(0, 120),
        author: book.author.slice(0, 100),
        genre: typeof book.genre === "string" ? book.genre : "Other",
        status: validStatus,
        totalPages,
        readPages: totalPages ? Math.min(readPages, totalPages) : readPages,
        rating: Math.min(5, Math.max(0, Number(book.rating) || 0)),
        cover: isSafeImageURL(book.cover) ? book.cover : "",
        createdAt: Number(book.createdAt) || Date.now()
    };
}

function saveBooks() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
        return true;
    } catch (error) {
        console.error("Could not save ReadNest library:", error);
        showToast("Couldn't save. Browser storage may be full.");
        return false;
    }
}

function isSafeImageURL(value) {
    if (!value) return true;

    try {
        const url = new URL(value);
        return url.protocol === "https:" || url.protocol === "http:";
    } catch {
        return false;
    }
}

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

function coverFallback(book) {
    const colors = [
        ["#f8c9df", "#b99be9"],
        ["#e9dfff", "#d989b7"],
        ["#fce1bd", "#e5a3b6"],
        ["#c8e9df", "#9d9ce4"],
        ["#f4d4ed", "#b4a3ec"]
    ];

    const colorIndex = [...book.title].reduce(
        (sum, character) => sum + character.charCodeAt(0),
        0
    ) % colors.length;

    const [first, second] = colors[colorIndex];
    const initials = book.title
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map(word => word[0])
        .join("")
        .toUpperCase();

    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="400" height="600" viewBox="0 0 400 600">
            <defs>
                <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
                    <stop stop-color="${first}"/>
                    <stop offset="1" stop-color="${second}"/>
                </linearGradient>
            </defs>
            <rect width="400" height="600" rx="18" fill="url(#g)"/>
            <rect x="25" y="25" width="350" height="550" rx="12" fill="none" stroke="#ffffff" stroke-opacity=".75" stroke-width="3"/>
            <text x="200" y="275" text-anchor="middle" font-family="Georgia,serif" font-size="100" fill="#ffffff">${initials}</text>
            <text x="200" y="355" text-anchor="middle" font-family="Georgia,serif" font-size="25" fill="#ffffff">${escapeHTML(book.title.slice(0, 25))}</text>
            <text x="200" y="395" text-anchor="middle" font-family="Arial,sans-serif" font-size="18" fill="#ffffff">${escapeHTML(book.author.slice(0, 30))}</text>
            <text x="200" y="520" text-anchor="middle" font-family="Arial,sans-serif" font-size="22" fill="#ffffff">♡ READNEST ♡</text>
        </svg>
    `;

    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function getCover(book) {
    return book.cover || coverFallback(book);
}

function renderStats() {
    const total = books.length;
    const completed = books.filter(book => book.status === "completed").length;
    const reading = books.filter(book => book.status === "reading").length;

    const pagesRead = books.reduce((sum, book) => {
        return sum + Math.min(
            Math.max(0, book.readPages),
            book.totalPages || book.readPages
        );
    }, 0);

    document.getElementById("totalBooks").textContent = total;
    document.getElementById("completedBooks").textContent = completed;
    document.getElementById("readingBooks").textContent = reading;
    document.getElementById("pagesRead").textContent = pagesRead.toLocaleString();
}

function getFilteredBooks() {
    const query = searchInput.value.trim().toLowerCase();
    const selectedStatus = statusFilter.value;
    const selectedGenre = genreFilter.value;

    return books
        .filter(book => {
            const matchesQuery =
                book.title.toLowerCase().includes(query) ||
                book.author.toLowerCase().includes(query) ||
                book.genre.toLowerCase().includes(query);

            const matchesStatus =
                selectedStatus === "all" || book.status === selectedStatus;

            const matchesGenre =
                selectedGenre === "all" || book.genre === selectedGenre;

            return matchesQuery && matchesStatus && matchesGenre;
        })
        .sort((a, b) => a.createdAt - b.createdAt);
}

function createBookCard(book) {
    const percentage = book.totalPages > 0
        ? Math.min(100, Math.round(book.readPages / book.totalPages * 100))
        : book.status === "completed" ? 100 : 0;

    const ratingMarkup = book.rating
        ? `<span aria-label="${book.rating} out of 5 stars">${"★".repeat(book.rating)}<span class="unrated">${"★".repeat(5 - book.rating)}</span></span>`
        : `<span class="unrated">Not rated yet ♡</span>`;

    const progressMarkup = book.totalPages > 0
        ? `
            <div class="progress-area">
                <div class="progress-label">
                    <span>${book.readPages} / ${book.totalPages} pages</span>
                    <span>${percentage}%</span>
                </div>
                <div class="progress-track" role="progressbar"
                     aria-label="Reading progress for ${escapeHTML(book.title)}"
                     aria-valuemin="0" aria-valuemax="${book.totalPages}"
                     aria-valuenow="${Math.min(book.readPages, book.totalPages)}">
                    <div class="progress-fill" style="width:${percentage}%"></div>
                </div>
            </div>
        `
        : `
            <div class="progress-area">
                <div class="progress-label">
                    <span>${book.status === "completed" ? "Story completed" : "Page count not set"}</span>
                    <span>${percentage}%</span>
                </div>
                <div class="progress-track">
                    <div class="progress-fill" style="width:${percentage}%"></div>
                </div>
            </div>
        `;

    return `
        <article class="book-card" data-id="${escapeHTML(book.id)}">
            <div class="book-cover-wrap">
                <img class="book-cover"
                     src="${escapeHTML(getCover(book))}"
                     alt="Cover of ${escapeHTML(book.title)}"
                     loading="lazy">
                <span class="status-badge">${escapeHTML(statusLabels[book.status])}</span>
            </div>

            <div class="book-card-content">
                <span class="book-genre">${escapeHTML(book.genre)}</span>
                <h3 class="book-title">${escapeHTML(book.title)}</h3>
                <p class="book-author">by ${escapeHTML(book.author)}</p>
                <div class="book-rating">${ratingMarkup}</div>
                ${progressMarkup}

                <div class="book-actions">
                    <button class="card-action" type="button" data-action="edit" data-id="${escapeHTML(book.id)}">Edit</button>
                    <button class="card-action" type="button" data-action="progress" data-id="${escapeHTML(book.id)}">+ Pages</button>
                    <button class="card-action delete-action" type="button" data-action="delete" data-id="${escapeHTML(book.id)}" aria-label="Delete ${escapeHTML(book.title)}">×</button>
                </div>
            </div>
        </article>
    `;
}

function renderBooks() {
    const filteredBooks = getFilteredBooks();

    bookGrid.innerHTML = filteredBooks.map(createBookCard).join("");
    emptyState.hidden = filteredBooks.length > 0;

    if (filteredBooks.length === 0) {
        const hasBooks = books.length > 0;
        emptyState.querySelector("h3").textContent = hasBooks
            ? "No books found ♡"
            : "Your bookshelf is waiting!";

        emptyState.querySelector("p").textContent = hasBooks
            ? "Try another search or change your filters."
            : "Add your first book and start building your cozy little library.";

        document.getElementById("emptyAddButton").hidden = hasBooks;
    }

    bookGrid.querySelectorAll(".book-cover").forEach(image => {
        image.addEventListener("error", () => {
            const book = books.find(item =>
                item.title === image.alt.replace(/^Cover of /, "")
            );

            if (book && image.dataset.fallbackApplied !== "true") {
                image.dataset.fallbackApplied = "true";
                image.src = coverFallback(book);
            }
        }, { once: true });
    });
}

function render() {
    renderStats();
    renderBooks();
}

function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(toastTimeout);

    toastTimeout = setTimeout(() => {
        toast.classList.remove("show");
    }, 2800);
}

function openBookDialog(book = null) {
    bookForm.reset();
    formError.hidden = true;
    formError.textContent = "";

    if (book) {
        document.getElementById("dialogTitle").textContent = "Edit your book";
        document.getElementById("saveBookButton").textContent = "Save changes ♡";

        fields.id.value = book.id;
        fields.title.value = book.title;
        fields.author.value = book.author;
        fields.cover.value = book.cover || "";
        fields.genre.value = book.genre;
        fields.status.value = book.status;
        fields.totalPages.value = book.totalPages || "";
        fields.readPages.value = book.readPages || 0;
        fields.rating.value = String(book.rating || 0);
    } else {
        document.getElementById("dialogTitle").textContent = "Add a book";
        document.getElementById("saveBookButton").textContent = "Save book ♡";

        fields.id.value = "";
        fields.status.value = "want";
        fields.readPages.value = "0";
        fields.rating.value = "0";
    }

    bookDialog.showModal();
}

function closeBookDialog() {
    bookDialog.close();
}

function handleBookSubmit(event) {
    event.preventDefault();
    formError.hidden = true;

    const title = fields.title.value.trim();
    const author = fields.author.value.trim();
    const cover = fields.cover.value.trim();
    const totalPages = Number(fields.totalPages.value) || 0;
    let readPages = Number(fields.readPages.value) || 0;
    let status = fields.status.value;
    const rating = Number(fields.rating.value) || 0;

    if (!title || !author) {
        return showFormError("Please enter both the book title and author.");
    }

    if (cover && !isSafeImageURL(cover)) {
        return showFormError("Please enter a valid image URL starting with http:// or https://.");
    }

    if (totalPages < 0 || totalPages > 100000) {
        return showFormError("Total pages must be between 0 and 100,000.");
    }

    if (readPages < 0 || readPages > 100000) {
        return showFormError("Pages read must be between 0 and 100,000.");
    }

    if (readPages > totalPages && totalPages > 0) {
        return showFormError("Pages read cannot exceed the total page count.");
    }

    if (totalPages > 0 && readPages === totalPages) {
        status = "completed";
    } else if (status === "completed" && totalPages > 0) {
        readPages = totalPages;
    }

    const existingId = fields.id.value;
    const existingBook = books.find(book => book.id === existingId);

    const book = normalizeBook({
        id: existingId || createId(),
        title,
        author,
        cover,
        genre: fields.genre.value,
        status,
        totalPages,
        readPages,
        rating,
        createdAt: existingBook?.createdAt || Date.now()
    });

    const oldBooks = [...books];

    if (existingId) {
        books = books.map(item => item.id === existingId ? book : item);
    } else {
        books.push(book);
    }

    if (!saveBooks()) {
        books = oldBooks;
        return;
    }

    closeBookDialog();
    render();
    showToast(existingId ? "Book updated successfully ♡" : "A new book joined your nest ♡");
}

function showFormError(message) {
    formError.textContent = message;
    formError.hidden = false;
}

function createId() {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
        return crypto.randomUUID();
    }

    return `book-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function editBook(id) {
    const book = books.find(item => item.id === id);
    if (book) openBookDialog(book);
}

function askDeleteBook(id) {
    const book = books.find(item => item.id === id);
    if (!book) return;

    pendingDeleteId = id;
    document.getElementById("deleteTitle").textContent = `Remove "${book.title}"?`;
    deleteDialog.showModal();
}

function confirmDeleteBook() {
    if (!pendingDeleteId) return;

    const oldBooks = [...books];
    books = books.filter(book => book.id !== pendingDeleteId);

    if (!saveBooks()) {
        books = oldBooks;
        return;
    }

    pendingDeleteId = null;
    deleteDialog.close();
    render();
    showToast("Book removed from your bookshelf.");
}

function updateProgress(id) {
    const book = books.find(item => item.id === id);
    if (!book) return;

    if (!book.totalPages) {
        openBookDialog(book);
        showToast("Add the total page count to track progress.");
        return;
    }

    const current = Math.min(book.readPages, book.totalPages);
    const input = prompt(
        `Update pages read for "${book.title}".\nEnter a number from 0 to ${book.totalPages}:`,
        String(current)
    );

    if (input === null) return;

    if (input.trim() === "" || !/^\d+$/.test(input.trim())) {
        showToast("Please enter a whole number of pages.");
        return;
    }

    const pages = Number(input);

    if (!Number.isSafeInteger(pages) || pages < 0 || pages > book.totalPages) {
        showToast(`Enter a number from 0 to ${book.totalPages}.`);
        return;
    }

    const oldBooks = [...books];

    book.readPages = pages;

    if (pages === book.totalPages) {
        book.status = "completed";
    } else if (pages > 0 && book.status !== "completed") {
        book.status = "reading";
    } else if (pages === 0 && book.status === "reading") {
        book.status = "want";
    } else if (book.status === "completed" && pages < book.totalPages) {
        book.status = pages > 0 ? "reading" : "want";
    }

    if (!saveBooks()) {
        books = oldBooks;
        return;
    }

    render();
    showToast(pages === book.totalPages
        ? "Another story completed! ✿"
        : "Reading progress updated ♡");
}

function handleBookGridClick(event) {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    const { action, id } = button.dataset;

    if (action === "edit") editBook(id);
    if (action === "delete") askDeleteBook(id);
    if (action === "progress") updateProgress(id);
}

function addBookFromButton() {
    openBookDialog();
}

function handleSearchShortcut(event) {
    if (event.key !== "/" || event.ctrlKey || event.metaKey || event.altKey) return;

    const tag = document.activeElement?.tagName;

    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

    event.preventDefault();
    searchInput.focus();
}

document.getElementById("openAddModal").addEventListener("click", addBookFromButton);
document.getElementById("heroAddButton").addEventListener("click", addBookFromButton);
document.getElementById("secondAddButton").addEventListener("click", addBookFromButton);
document.getElementById("emptyAddButton").addEventListener("click", addBookFromButton);

document.getElementById("closeModal").addEventListener("click", closeBookDialog);
document.getElementById("cancelModal").addEventListener("click", closeBookDialog);
document.getElementById("cancelDelete").addEventListener("click", () => {
    pendingDeleteId = null;
    deleteDialog.close();
});
document.getElementById("confirmDelete").addEventListener("click", confirmDeleteBook);

bookForm.addEventListener("submit", handleBookSubmit);
bookGrid.addEventListener("click", handleBookGridClick);

searchInput.addEventListener("input", renderBooks);
statusFilter.addEventListener("change", renderBooks);
genreFilter.addEventListener("change", renderBooks);

bookDialog.addEventListener("click", event => {
    if (event.target === bookDialog) closeBookDialog();
});

deleteDialog.addEventListener("click", event => {
    if (event.target === deleteDialog) {
        pendingDeleteId = null;
        deleteDialog.close();
    }
});

document.addEventListener("keydown", handleSearchShortcut);

render();