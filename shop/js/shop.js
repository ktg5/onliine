let settings = [
    {
        title: 'Always Wednesdays',
        desc: 'Always play "Update Day" from Nirvana The Band The Show',
        key: 'alwaysWednesdays',
        option: {
            type: 'toggle',
            value: false
        },
    }
]


var channelConfig = {};
// Change bg music and load
window.addEventListener('load', () => {
    // set channel config if not set already
    settings.forEach((option) => {
        const currentValue = getChannelConfigKey(option.key);
        if (!currentValue) editChannelConfig(option.key, option.option.value);
        channelConfig = getChannelConfig();
        console.log('channel config:', channelConfig);
    });


    // page stuff
    // Aspect ratio loop
    setInterval(() => {
        let target1 = document.querySelector('#aspectcontainer');
        let target2 = document.querySelector('#bg .dots');
        let scale = Math.min(window.innerWidth / 608, window.innerHeight / 456);
        let top = (window.innerHeight - target1.clientHeight) / 2 + "px";
        let left = (window.innerWidth - target1.clientWidth) / 2 + "px";

        target1.style.scale = scale;
        target2.style.scale = scale;
        target1.style.top = top;
        target2.style.top = top;
        target1.style.left = left;
        target2.style.left = left;
    }, 50);

    // Init buttons
    setTimeout(() => {
        initButtonClick();
    }, 100);

    // Music
    startMusic();
});


function startMusic() {
    if (new Date().getDay() === 3 || getChannelConfigKey('alwaysWednesdays') === true) {
        setBGMusic('shop/music/wednesdays.mp3', 'shop/music/intro.mp3');
    } else {
        setBGMusic('shop/music/loop.mp3', 'shop/music/intro.mp3');
    }
}


async function makeItem(category, id) {
    if (!category || !id) {
        console.error('makeItem: category and id are required');
    }
    // Make sure the id has not been added already
    let productDiv = document.querySelector(`.product#${id}`);
    if (productDiv) {
        return;
    }
    let categoryName;
    switch (category) {
        case 'vconsole':
            categoryName = 'Virtual Console';
        break;

        case 'wiiware':
            categoryName = 'WiiWare';
        break;

        case 'channels':
            categoryName = 'Wii Channels';
        break;
    }

    let item = shopItems[category].find(item => item.id === id);
    if (!shopItems[category] || !item) {
        console.error('makeItem: category or item not found');
    }

    
    // Get assets URL
    let channelAssets;
    if (!item.assets.includes('http://') && !item.assets.includes('https://')) {
        channelAssets = `../${item.assets}`;
    }
    const channelIDLocation = channelAssets + item.id;

    // Init item to page
    const titles = document.querySelector('.titles');
    const titleDiv = document.createElement('div');
    titleDiv.classList.add('product');
    titleDiv.setAttribute('data-id', item.id);
    titleDiv.setAttribute('page', `item?id=${item.id}`);
    titles.insertAdjacentElement('beforeend', titleDiv);
    // Fetch for possible thumbnails
    const channelThumb = await getTitleThumb(channelIDLocation);
    // Add details to page
    titleDiv.innerHTML = `
<div class="preview" style="background: url('${channelIDLocation}/${channelThumb}');"></div>
<div class="info">
    <span class="title">${item.title}</span>
    <div class="spacer"></div>
    <div class="below">
        <span class="publisher">${item.publisher}</span>
        <span class="category">${categoryName}</span>
    </div>
</div>
    `;
    productDiv = document.querySelector(`.product#${id}`);
}


function getTitleThumb(channelIDLocation) {
    let possibleThumbs = [
        'thumb.png',
        'thumb.jpg',
        'thumb.jpeg',
        'thumb.gif',
        'thunb.webp',
        'video.gif',
        'video.webp',
    ]
    let foundThumb = false;
    return new Promise((res, rej) => {
        possibleThumbs.forEach(async thumb => {
            if (foundThumb === true) {
                return;
            } else {
                var http = new XMLHttpRequest();
                http.open('HEAD', `${channelIDLocation}/${thumb}`, false);
                http.send();

                if (http.status == 200) {
                    // debug obv
                    // console.log(`Found thumbnail: ${thumb}`);
                    res(thumb);
                    foundThumb = true;
                }
            }
        });
    });
}


function checkItems() {
    let shopItems = document.querySelectorAll('.titles .product');
    shopItems.forEach(item => {
        // Check if item is in the user's channel storage
        if (userChannels.find(channel => channel.id === item.id)) {
            item.setAttribute('downloaded', '');
            item.insertAdjacentHTML('beforeend', `<span class="downlaoded">Downloaded</span>`);
        }
    });
}


prevHtmlName = '';
/**
 * Function to change the page content based on the provided htmlName.
 *
 * @param {string} htmlName - The name of the HTML page (without the ".html" extension) to be displayed.
 * @param {Object} args - The arguments to be passed to the HTML page.
 * @return {void} This function does not return any value.
 */
function changePage(htmlName, args) {
    let target = document.querySelector('#contentframe');
    let backButton = document.querySelector('.bottom .back');
    let htmlNameBack;


    // Make htmlNameBack
    if (htmlName.split('/').length > 1) {
        htmlNameBack = htmlName.split('/')[0];
    }

    // Clear and change "from-html"
    target.innerHTML = '';
    target.setAttribute('from-html', `pages/${htmlName}.html`);

    // Check if "htmlName" is "index"
    switch (true) {
        case htmlName.startsWith('index'):
            backButton.onclick = () => {
                playSFX('button-cancel.mp3', userConfig.sfxVol);
                window.location.href = '/?skipwarn=true';
            };
            backButton.innerHTML = 'Wii Menu';

            let headerElmnt = document.querySelector('.header');
            headerElmnt.style.color = "#37bef4";
            headerElmnt.innerHTML = 'Wii Shop Channel';
        break;

        case htmlName.startsWith('item'):
            targetPage = prevHtmlName;
            backButton.onclick = () => {
                playSFX('button-cancel.mp3', userConfig.sfxVol);
                changePage(targetPage);
            };
        break;
    
        default:
            backButton.onclick = () => {
                playSFX('button-cancel.mp3', userConfig.sfxVol);
                changePage('index');
            };
            backButton.innerHTML = 'Back';
        break;
    }

    // Init
    includeHTML();
    /// When everything is loaded
    setTimeout(async () => {
        // Init store buttons if detected
        const titles = document.querySelector('.titles');
        if (titles) {
            const currentCategory = titles.getAttribute('category');
            switch (currentCategory) {
                case 'downloaded':
                    if (userChannels.length > 0) {
                        userChannels.forEach(channel => {
                            makeItem(titles.getAttribute('category'), channel.id);
                        });
                    }
                break;

                case 'settings':
                    initSettings();
                break;
            
                default:
                    shopItems[titles.getAttribute('category')].forEach(channel => {
                        makeItem(titles.getAttribute('category'), channel.id);
                    });
                break;
            }
        }

        // Init item page if on it
        const contentFrame = document.querySelector('.item-container');
        if (contentFrame) {
            // get channel data from location args
            const url = new URLSearchParams(htmlName);
            const itemId = url.get('item?id');
            if (!itemId) alert(`A item ID was not provided as a search param when using the "item" page.`);

            // find item in db
            let item;
            for (const [tableName, table] of Object.entries(shopItems)) {
                const found = table.find(obj => obj.id === itemId);

                if (found) {
                    item = found;
                    break;
                }
            }
            if (!item) return alert(`The item under the ID of "${itemId}" was not found in the "shopitems.js" file!`);

            // make html with data
            let channelAssets;
            if (!item.assets.includes('http://') && !item.assets.includes('https://')) {
                channelAssets = `../${item.assets}`;
            }
            const channelIDLocation = channelAssets + item.id;
            const channelThumb = await getTitleThumb(channelIDLocation);
            console.log(`${channelIDLocation}/${channelThumb}`);
            document.querySelector('.thumb').style.background = `url('${channelIDLocation}/${channelThumb}')`;
            document.querySelector('.author').textContent = item.publisher;
            document.querySelector('.title').textContent = item.title;

            // show
            document.querySelector('.item-container').style.display = '';
        }


        // Hover SFX
        initButtonClick();


        // Check for rename header
        let renameElmnt = document.querySelector('.rename-header');
        let headerElmnt = document.querySelector('.header');
        if (renameElmnt) {
            headerElmnt.innerHTML = renameElmnt.innerHTML;
            headerElmnt.style.color = 'black';
        }
    }, 50);


    // We wanna make this one local
    function initSettings() {
        let titles = document.querySelector('.titles');
        
        settings.forEach(setting => {
            titles.insertAdjacentHTML('beforeend', `
<div class="product setting" data-id="${setting.key}" data-type="${setting.option.type}">
    <div class="preview" style="background: url('assets/${setting.key}.png');"></div>
    <div class="info">
        <span class="title">${setting.title}</span>
        <div class="spacer"></div>
        <div class="below">
            <span class="publisher">${setting.desc}</span>
            <span class="category">Value: <kbd>${channelConfig[setting.key]}</kbd></span>
        </div>
    </div>
</div>
            `);

            const settingDiv = document.querySelector(`.setting[data-id="${setting.key}"]`);
            if (settingDiv) {
                switch (setting.option.type) {
                    case 'toggle':
                        settingDiv.addEventListener('click', () => {
                            const newValue = !channelConfig[setting.key];
                            editChannelConfig(setting.key, newValue);
                            settingDiv.querySelector('.below .category kbd').textContent = newValue;
                        });
                    break;
                
                    default:
                        alert(`the setting under "${setting.key}" does not have a "option.type"! fix that now!!!!!!!`);
                    break;
                }
            } else alert('something happened');
        });
    }


    prevHtmlName = htmlName;
}