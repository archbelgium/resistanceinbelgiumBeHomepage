let debounceTimeout;
let currentFocus = -1;

const searchInput = document.getElementById( 'search' );
const resultsDiv = document.getElementById( 'results' );

document.addEventListener( 'click', ( event ) => {
	if( !resultsDiv.contains( event.target ) && !searchInput.contains( event.target ) ) {
		resultsDiv.classList.remove( 'show' );
	}
} );

searchInput.addEventListener( 'keydown', ( e ) => {
	const items = resultsDiv.getElementsByClassName( 'dropdown-item' );

	if( e.key === 'Enter' ) {
		e.preventDefault();
		if( currentFocus > -1 && items[currentFocus] ) {
			window.location.href = items[currentFocus].getAttribute( 'href' );
		} else {
			const searchTerm = searchInput.value.trim();
			if( searchTerm ) {
				window.location.href = baseUrl + `/w/index.php?search=${ encodeURIComponent( searchTerm ) }&title=Special:Search`;
			}
		}
	} else if( resultsDiv.classList.contains( 'show' ) ) {
		if( e.key === 'ArrowDown' || e.key === 'ArrowUp' ) {
			currentFocus = (e.key === 'ArrowDown') ? currentFocus + 1 : currentFocus - 1;
			addActive( items );
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

async function search() {
	const searchTerm = searchInput.value.trim();
	if( !searchTerm ) {
		displayResults( [] );
		return;
	}

	try {
		const urlParams = new URLSearchParams( window.location.search );
		const language = urlParams.get( 'lang' ) || 'en';

		const searchData = await searchEntities( searchTerm, language );
		const entityIds = searchData.search.map( result => result.id );
		const entities = await getEntities( entityIds );

		const results = searchData.search.map( result => {
			const entity = entities.entities[result.id];
			const dateOfBirth = isPerson( entity ) ? getDateOfBirth( entity ) : null;
			return { ...result, dateOfBirth };
		} );

		displayResults( results );
	} catch( error ) {
		console.error( 'Error fetching data:', error );
	}
}

async function searchEntities( searchTerm, language ) {
	const url = baseUrl + `/w/api.php?action=wbsearchentities&search=${ encodeURIComponent( searchTerm ) }&language=${ language }&uselang=${ language }&format=json&origin=*`;
	const response = await fetch( url );
	return response.json();
}

async function getEntities( entityIds ) {
	const url = baseUrl + `/w/api.php?action=wbgetentities&ids=${ entityIds.join( '|' ) }&props=claims&format=json&origin=*`;
	const response = await fetch( url );
	return response.json();
}

function isPerson( entity ) {
	const personClaim = entity.claims.P1;
	return personClaim && personClaim[0].mainsnak.datavalue.value.id === 'Q2';
}

function getDateOfBirth( entity ) {
	const dateOfBirthClaim = entity.claims.P10;
	return dateOfBirthClaim ? dateOfBirthClaim[0].mainsnak.datavalue.value : null;
}

function displayResults( results ) {
	resultsDiv.innerHTML = '';
	currentFocus = -1;

	if( !results.length ) {
		resultsDiv.classList.remove( 'show' );
		return;
	}

	resultsDiv.classList.add( 'show' );

	results.forEach( ( result, index ) => {
		const a = document.createElement( 'a' );
		a.classList.add( 'dropdown-item', 'text-wrap' );
		a.href = result.url;

		const label = document.createElement( 'div' );
		label.classList.add( 'result-label' );
		label.textContent = result.label + (result.dateOfBirth ? ` (${ result.dateOfBirth })` : '');

		const description = document.createElement( 'div' );
		description.classList.add( 'result-description', 'small' );
		description.textContent = result.description;

		a.append( label, description );
		resultsDiv.appendChild( a );

		a.addEventListener( 'mouseover', () => {
			currentFocus = index;
			addActive( resultsDiv.getElementsByClassName( 'dropdown-item' ) );
		} );
	} );

	// New Add "Show all results"
	const searchTerm = searchInput.value.trim();
	if (searchTerm) {
		const extraLink = document.createElement( 'a' );
		extraLink.classList.add( 'dropdown-item', 'search-footer' );
		extraLink.href = `${baseUrl}/w/index.php?search=${encodeURIComponent(searchTerm)}&title=Special:Search`;
		const lang = new URLSearchParams(window.location.search).get('lang') || 'en';
		const showAllResultsText = {
			en: 'Show all results',
			fr: 'Afficher tous les résultats',
			nl: 'Toon alle resultaten',
			de: 'Alle Ergebnisse anzeigen'
		}[lang] || 'Show all results';
		extraLink.textContent = showAllResultsText;
		

		resultsDiv.appendChild( extraLink );
	}

	if( results.length === 1 ) {
		currentFocus = 0;
		addActive( resultsDiv.getElementsByClassName( 'dropdown-item' ) );
	}
}

function showResultsIfAny() {
	if( resultsDiv.innerHTML.trim() ) {
		resultsDiv.classList.add( 'show' );
	}
}

function changeLanguage( lang ) {
	window.location.href = `${ window.location.pathname }?lang=${ lang }`;
}

document.addEventListener( 'DOMContentLoaded', function() {
	const languageLinks = document.querySelectorAll( '.nav-link[data-lang]' );

	languageLinks.forEach( link => {
		link.addEventListener( 'click', function( e ) {
			e.preventDefault();
			changeLanguage( this.getAttribute( 'data-lang' ) );
		});
	});
});

searchInput.addEventListener( 'input', debounceSearch );
searchInput.addEventListener( 'focus', showResultsIfAny );
