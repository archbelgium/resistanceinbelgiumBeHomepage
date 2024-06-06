let debounceTimeout;
let language = 'en';

document.addEventListener('click', function (event) {
    const resultsDiv = document.getElementById('results');
    const searchInput = document.getElementById('search');
    if (!resultsDiv.contains(event.target) && !searchInput.contains(event.target)) {
        resultsDiv.classList.remove('show');
    }
});

function debounceSearch() {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(search, 400);
}

function search() {
    const searchTerm = document.getElementById('search').value;
    if (!searchTerm.trim()) {
        displayResults([]);
        return;
    }
    const apiUrl = `https://data.arch.be/w/api.php?action=wbsearchentities&search=${encodeURIComponent(searchTerm)}&language=${language}&uselang=${language}&format=json&origin=*`;

    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            displayResults(data.search);
        })
        .catch(error => {
            console.error('Error fetching data:', error);
        });
}

function displayResults(results) {
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '';

    if (results.length === 0) {
        resultsDiv.classList.remove('show');
        return;
    }

    resultsDiv.classList.add('show');

    results.forEach(result => {
        const a = document.createElement('a');
        a.classList.add('dropdown-item', 'text-wrap');
        a.setAttribute('href', result.url);

        const label = document.createElement('div');
        label.classList.add('result-label');
        label.textContent = result.label;

        const description = document.createElement('div');
        description.classList.add('result-description', 'small');
        description.textContent = result.description;

        a.appendChild(label);
        a.appendChild(description);
        resultsDiv.appendChild(a);
    });
}

function showResultsIfAny() {
    const resultsDiv = document.getElementById('results');
    if (resultsDiv.innerHTML.trim() !== '') {
        resultsDiv.classList.add('show');
    }
}
