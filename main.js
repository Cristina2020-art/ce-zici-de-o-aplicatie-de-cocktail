/* form elements */
const input = document.getElementById('input');
const searchValue = input.value;
const checkbox = document.getElementById('non-alcoholic');
const searchForm = document.getElementById('search-form');
const invalidInputMessage = document.getElementById('invalid-input-message');
const searchButtonText = document.getElementById('search-button-text');
const searchButton = document.getElementById('search-button');
const randomButtonText = document.getElementById('random-drink-button-text');
const loadingSpinnerRandom = document.getElementById('loading-spinner--random');
const loadingSpinnerSearch = document.getElementById('loading-spinner--search');

/* content containers */
const contentDescription = document.getElementById('content-description');
const drinkContainer = document.getElementById('drink-container');
const drinkList = document.getElementById('drink-list');
const listView = document.getElementById('list-view');
const singleView = document.getElementById('single-view');

/* buttons */
const backToListButton = document.getElementById('back-to-list-button');
const randomDrinkButton = document.getElementById('random-drink-button');

/* control variables */
const cacheTimeSeconds = 60 * 10;
/* before user has searched searchmode is false and drinkmode is true
this pretty much controls how the content is displayed (see displaySingleDrink) */
let searchMode = false;
let randomDrinkMode = true;

/* display/shows the 2 different containers in order to simulate switching pages */
const displayDrinkListView = () => {
    listView.classList.remove('hidden');
    singleView.classList.add('hidden');
    contentDescription.classList.remove('hidden');
}

const displaySingleDrinkView = () => {
    singleView.classList.remove('hidden');
    listView.classList.add('hidden');
}

const showLoadingSpinnerSearch = () => {
    loadingSpinnerSearch.classList.remove('hidden');
    searchButton.setAttribute('disabled', 'disabled');
    searchButtonText.classList.add('hidden');
}

const hideLoadingSpinnerSearch = () => {
    loadingSpinnerSearch.classList.add('hidden');
    searchButton.removeAttribute('disabled', 'disabled');
    searchButtonText.classList.remove('hidden');
}

const showLoadingSpinnerRandom = () => {
    loadingSpinnerRandom.classList.remove('hidden');
    randomDrinkButton.setAttribute('disabled', 'disabled');
    randomButtonText.classList.add('hidden');
}

const hideLoadingSpinnerRandom = () => {
    loadingSpinnerRandom.classList.add('hidden');
    randomDrinkButton.removeAttribute('disabled', 'disabled');
    randomButtonText.classList.remove('hidden');
}

const fetchNonAlcoholicList = () => {
    return fetch(`https://www.thecocktaildb.com/api/json/v1/1/filter.php?a=Non_Alcoholic`)
        .then(response => response.json());
}

const fetchDrinkByIngredient = searchWord => {
    // formats searchinput so for example GIN and gin only results in one cache
    const formatedSearchword = searchWord.trim().toLowerCase();
    const localStorageKey = `searchedIngredient:${formatedSearchword}`;
    const cachedSearchResult = localStorage.getItem(localStorageKey);

    // if the searchresults already exists in localstorage use that
    if (cachedSearchResult) {
        const data = JSON.parse(cachedSearchResult);
        const secondsSinceCached = (Date.now() - data.timeStamp) / 1000;
        /* if our cache is less than 10 minutes old return solved promise 
        otherwise make a new get request */
        if (secondsSinceCached < cacheTimeSeconds) {
            return Promise.resolve(JSON.parse(cachedSearchResult));
        }
    }

    return fetch(`https://www.thecocktaildb.com/api/json/v1/1/filter.php?i=${formatedSearchword}`)
        .then(response => response.text())
        .then(text => {
            /* if user searches for a drink name e.g. tom collins this fetch wont return anything
            i.e. this promise wont resolve and searchfunction wont complete. so if this occur an
            empty array so promise gets resolved.  */
            if (text.length > 0) {
                return JSON.parse(text);
            } else {
                return { drinks: [] };
            }
        })
        .then(data => {
            // to be able to control how long we save data in localstorage current time is saved here
            data.timeStamp = Date.now();
            localStorage.setItem(localStorageKey, JSON.stringify(data));
            return data;
        });
}

/* see comments on fetchDrinkByIngredient, they work the same way */
const fetchDrinkByDrinkName = searchWord => {
    const formatedSearchword = searchWord.trim().toLowerCase();
    const localStorageKey = `searchedDrinkName:${formatedSearchword}`;
    const cachedSearchResult = localStorage.getItem(localStorageKey);

    if (cachedSearchResult) {
        const data = JSON.parse(cachedSearchResult);
        const secondsSinceCached = (Date.now() - data.timeStamp) / 1000;
        if (secondsSinceCached < cacheTimeSeconds) {
            return Promise.resolve(JSON.parse(cachedSearchResult));
        }
    }

    return fetch(`https://www.thecocktaildb.com/api/json/v1/1/search.php?s=${formatedSearchword}`)
        .then(response => response.json())
        .then(data => {
            if (data.drinks === null) {
                return { drinks: [] };
            } else {
                return data;
            }
        })
        .then(data => {
            data.timeStamp = Date.now();
            localStorage.setItem(localStorageKey, JSON.stringify(data));
            return data;
        });
}

/* checks if user just types blank spaces in searchfield */
const isValidInput = searchWord => {
    if (!searchWord.trim()) {
        return false;
    }
    return true;
}

const searchForDrink = searchWord => {
    // if user just submits blank spaces the searchfunction wont excecute
    if (!isValidInput(searchWord)) {
        invalidInputMessage.classList.remove('invisible');
        return;
    }

    // hide error message and show loadingspinner
    invalidInputMessage.classList.add('invisible');
    showLoadingSpinnerSearch();

    // if all promises are resolved we continue
    Promise.all([
        fetchNonAlcoholicList(),
        fetchDrinkByIngredient(searchWord),
        fetchDrinkByDrinkName(searchWord)
    ])
        .then(result => {
            const nonAlcholicData = result[0];
            const drinkIngredientsData = result[1];
            const drinkNamesData = result[2];
            const nonAlcoholicDrinkIds = [];

            // saving all id's of the non-alcoholic drinks
            for (const drink of nonAlcholicData.drinks) {
                nonAlcoholicDrinkIds.push(drink.idDrink);
            }

            // list of all drinks to display
            const filtered = [];
            const filteredId = [];

            // goes through all drinknames
            for (const drink of drinkNamesData.drinks) {
                /* if user has chosen 'only show non-alcoholic' check if theres a matching 
                drinkid in our list of non-alcoholic drinks or if user wants both */
                if ((checkbox.checked && nonAlcoholicDrinkIds.indexOf(drink.idDrink) > -1)
                    || !checkbox.checked) {

                    filtered.push(drink);
                    filteredId.push(drink.idDrink);
                }
            }

            // checks if theres a match in the drinkingredientlist
            for (const drink of drinkIngredientsData.drinks) {
                if ((checkbox.checked && nonAlcoholicDrinkIds.indexOf(drink.idDrink) > -1)
                    || !checkbox.checked) {

                    if (filteredId.indexOf(drink.idDrink) === -1) {
                        filtered.push(drink);
                        filteredId.push(drink.idDrink);
                    }
                }
            }

            searchMode = true;
            randomDrinkMode = false;
            hideLoadingSpinnerSearch();
            displayDrinksAsList(filtered, searchWord);
        })
        .catch(error => {
            hideLoadingSpinnerSearch();
            contentDescription.innerText = 'Something went wrong, try again.';
        });
}

/* the other get requests made does not return info like recipe and instructions
therefore another request is needed */
const getDrink = id => {
    searchMode = true;
    randomDrinkMode = false;

    fetch(`https://www.thecocktaildb.com/api/json/v1/1/lookup.php?i=${id}`)
        .then(response => response.json())
        .then(data => {
            displaySingleDrink(data.drinks);
        })
        .catch(error => {
            contentDescription.innerText = 'Something went wrong, try again.';
        });
}

const getRandomDrink = () => {
    showLoadingSpinnerRandom();
    fetch('https://www.thecocktaildb.com/api/json/v1/1/random.php')
        .then(response => response.json())
        .then(data => {
            hideLoadingSpinnerRandom();
            displaySingleDrink(data.drinks);
        })
        .catch(error => {
            hideLoadingSpinnerRandom();
            contentDescription.innerText = 'Something went wrong, try again.';
        });
}

const displaySingleDrink = drinks => {
    displaySingleDrinkView();
    for (const drink of drinks) {
        const drinkTitle = singleView.querySelector('.drink-title');

        /* if user has used the searchfield a 'back to search list' button is displayed 
        above the recipe */
        if (searchMode) {
            // since flex is has higher specificity in tailwind flex is toggled instead
            backToListButton.classList.add('flex');
        } else {
            backToListButton.classList.remove('flex');
        }

        /* if user only uses 'random drink button' the drink title is instead used as a 
        part of a headline */
        if (randomDrinkMode) {
            contentDescription.innerText = `How about a ${drink.strDrink}?`;
            drinkTitle.classList.add('hidden');
        } else {
            contentDescription.classList.add('hidden');
            drinkTitle.classList.remove('hidden');
        }

        const drinkImage = `<img class="rounded" src="${drink.strDrinkThumb}" alt="${drink.strDrink}"/>`;

        const measureArray = [];
        const ingredientsArray = [];
        const drinksProperties = Object.keys(drink);

        /* the object returned from getDrink does not collect ingredients and measurements
        in arrays so its manually done here */
        for (const drinkProperty of drinksProperties) {
            if (drinkProperty.includes('strIngredient')) {
                ingredientsArray.push(drink[drinkProperty]);
            } else if (drinkProperty.includes('strMeasure')) {
                measureArray.push(drink[drinkProperty]);
            }
        }

        let drinkIngredients = '';

        // when put into arrays they are structured for display
        for (let i = 0; i < ingredientsArray.length; i++) {
            const ingredient = ingredientsArray[i];
            const measures = measureArray[i];

            if (ingredient && ingredient.trim()) {
                drinkIngredients += `<li class="list-reset mb-2">${measures} ${ingredient}</li>`;
            }
        }

        const drinkInstructionsContainer = singleView.querySelector('#drink-instructions');
        const drinkImageContainer = singleView.querySelector('.drink-image-container');
        const drinkIngredientsContainer = singleView.querySelector('#drink-ingredients');
        const drinkInstructions = drink.strInstructions;
        const drinkInfo = drink.strDrink;

        drinkImageContainer.innerHTML = drinkImage;
        drinkIngredientsContainer.innerHTML = drinkIngredients;
        drinkInstructionsContainer.innerHTML = drinkInstructions;
        drinkTitle.innerHTML = drinkInfo;
    }
}

const displayDrinksAsList = (drinks, searchWord) => {

    if (drinks.length === 0) {
        contentDescription.innerText = `Nothing found on ${searchWord}.`;
    } else {
        contentDescription.innerText = `Showing search result(s) for ${searchWord}:`;
    }
    
    drinkList.innerHTML = '';

    for (const drink of drinks) {
        const drinkId = drink.idDrink;
        const searchResult = drinkContainer.cloneNode(true);
        const imageContainerItem = searchResult.querySelector('.drink-image-container');

        // each listitem becomes clickable and when clicked getDrink is executed
        searchResult.addEventListener('click', () => {
            getDrink(drinkId);
        });

        const drinkImageList = `<img class="rounded" src="${drink.strDrinkThumb}" alt="${drink.strDrink}"/>`;
        imageContainerItem.innerHTML = drinkImageList;
        const searchResultTitle = searchResult.querySelector('.drink-title');
        searchResultTitle.innerText = drink.strDrink;
        drinkList.appendChild(searchResult);
    }

    displayDrinkListView();
}

searchForm.addEventListener('submit', event => {
    event.preventDefault();
    const searchValue = input.value;
    searchForDrink(searchValue);
});

randomDrinkButton.addEventListener('click', () => {
    getRandomDrink();
});

backToListButton.addEventListener('click', () => {
    displayDrinkListView();
});

getRandomDrink();