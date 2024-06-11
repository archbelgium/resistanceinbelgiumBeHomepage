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

async function search() {
	const searchTerm = searchInput.value.trim();
	if( !searchTerm ) {
		displayResults( [] );
		return;
	}

	try {
		// Get the language from the URL or default to 'en'
		const urlParams = new URLSearchParams( window.location.search );
		const language = urlParams.get( 'lang' ) || 'en';

		const searchData = await searchEntities( searchTerm, language );
		const entityIds = searchData.search.map( result => result.id );
		const entities = await getEntities( entityIds );

		const results = searchData.search.map( result => {
			const entity = entities.entities[ result.id ];
			const dateOfBirth = isPerson( entity ) ? getDateOfBirth( entity ) : null;
			return { ...result, dateOfBirth };
		} );

		displayResults( results );
	} catch ( error ) {
		console.error( 'Error fetching data:', error );
	}
}

async function searchEntities( searchTerm, language ) {
	const url = `https://data.arch.be/w/api.php?action=wbsearchentities&search=${ encodeURIComponent( searchTerm ) }&language=${ language }&uselang=${ language }&format=json&origin=*`;
	const response = await fetch( url );
	return response.json();
}

async function getEntities( entityIds ) {
	const url = `https://data.arch.be/w/api.php?action=wbgetentities&ids=${ entityIds.join( '|' ) }&props=claims&format=json&origin=*`;
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
		label.textContent = result.label + ( result.dateOfBirth ? ` (${ result.dateOfBirth })` : '' );

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
