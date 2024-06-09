let debounceTimeout;
let currentFocus = -1;

const searchInput = document.getElementById( 'search' );
const resultsDiv = document.getElementById( 'results' );
const resultsContent = document.getElementById( 'results-content' );
const infoMessage = document.getElementById( 'info-message' );

document.addEventListener( 'click', ( event ) => {
	if( !resultsDiv.contains( event.target ) && !searchInput.contains( event.target ) ) {
		resultsDiv.classList.remove( 'show' );
	}
} );

searchInput.addEventListener( 'keydown', ( e ) => {
	const items = resultsDiv.getElementsByClassName( 'dropdown-item' );

	if( resultsDiv.classList.contains( 'show' ) ) {
		if( e.key === 'ArrowDown' || e.key === 'ArrowUp' ) {
			currentFocus = (e.key === 'ArrowDown') ? currentFocus + 1 : currentFocus - 1;
			addActive( items );
			e.preventDefault();
		} else if( e.key === 'Enter' && currentFocus > -1 && items[currentFocus] ) {
			window.location.href = items[currentFocus].getAttribute( 'href' );
			e.preventDefault();
		}
	}
} );

function addActive( items ) {
	if( !items ) {
		return;
	}
	removeActive( items );
	currentFocus = (currentFocus >= items.length) ? 0 : (currentFocus < 0) ? items.length - 1 : currentFocus;
	items[currentFocus].classList.add( 'active' );
	items[currentFocus].scrollIntoView( { block: 'nearest' } );
}

function removeActive( items ) {
	Array.from( items ).forEach( item => item.classList.remove( 'active' ) );
}

function debounceSearch() {
	clearTimeout( debounceTimeout );
	debounceTimeout = setTimeout( search, 400 );
}

function search() {
	const searchTerm = searchInput.value.trim();
	if( !searchTerm ) {
		displayResults( [] );
		return;
	}

	// Get the language from the URL or default to 'en'
	const urlParams = new URLSearchParams( window.location.search );
	const language = urlParams.get( 'lang' ) || 'en';

	const apiUrl = `https://data.arch.be/w/api.php?action=wbsearchentities&search=${ encodeURIComponent( searchTerm ) }&language=${ language }&uselang=${ language }&format=json&origin=*`;
	fetch( apiUrl )
		.then( response => response.json() )
		.then( data => displayResults( data.search ) )
		.catch( error => console.error( 'Error fetching data:', error ) );
}

function displayResults( results ) {
	resultsContent.innerHTML = '';
	currentFocus = -1;

	if( !results.length ) {
		resultsDiv.classList.remove( 'show' );
		infoMessage.style.display = 'none';
		return;
	}

	resultsDiv.classList.add( 'show' );

	results.forEach( ( result, index ) => {
		const a = document.createElement( 'a' );
		a.classList.add( 'dropdown-item', 'text-wrap' );
		a.href = result.url;

		const label = document.createElement( 'div' );
		label.classList.add( 'result-label' );
		label.textContent = result.label;

		const description = document.createElement( 'div' );
		description.classList.add( 'result-description', 'small' );
		description.textContent = result.description;

		a.append( label, description );
		resultsContent.appendChild( a );

		a.addEventListener( 'mouseover', () => {
			currentFocus = index;
			addActive( resultsContent.getElementsByClassName( 'dropdown-item' ) );
		} );
	} );

	infoMessage.style.display = 'block';
}

function showResultsIfAny() {
	if( resultsContent.innerHTML.trim() ) {
		resultsDiv.classList.add( 'show' );
	}
}

function changeLanguage( lang ) {
	window.location.href = `${ window.location.pathname }?lang=${ lang }`;
}

resultsDiv.addEventListener( 'scroll', () => {
	infoMessage.style.paddingBottom = (resultsDiv.scrollHeight - resultsDiv.scrollTop === resultsDiv.clientHeight) ? '0' : '20px';
} );

searchInput.addEventListener( 'input', debounceSearch );
searchInput.addEventListener( 'focus', showResultsIfAny );
