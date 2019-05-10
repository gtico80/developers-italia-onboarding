const ipaInput = document.querySelector('input#ipa');
const refInput = document.querySelector('input#nomeReferente');
const urlInput = document.querySelector('input#url');

if (ipaInput) {
//validation
  ipaInput.addEventListener('input', () => {
    ipaInput.setCustomValidity('');
    ipaInput.checkValidity();
  });

  refInput.addEventListener('input', () => {
    refInput.setCustomValidity('');
    refInput.checkValidity();
  });

  urlInput.addEventListener('input', () => {
    urlInput.setCustomValidity('');
    urlInput.checkValidity();
  });

  ipaInput.addEventListener('invalid', () => {
    if (ipaInput.value === '')
      ipaInput.setCustomValidity('Selezionare un\'amministrazione dal campo Ricerca Amministrazione!');
  });

  refInput.addEventListener('invalid', () => {
    if (refInput.value === '')
      refInput.setCustomValidity('Specificare un referente per l\'amministrazione!');
  });

  urlInput.addEventListener('invalid', () => {
    if (urlInput.value === '')
      urlInput.setCustomValidity('Specificare un URL di riferimento!');
  });
}

/**
 * Creating dynamic list for autocomplete
 * @param result data from remote call
 * @returns {string}
 */
function getResultElement(result) {
  return '<li class="result-item" data-ipa="' + result.ipa + '" data-pec="' + result.pec + '" ' +
    'data-description="' + result.description + '" data-office="' + result.office + '">'
    + '<a href="#">' +
    '    <span class="autocomplete-list-text">\n' +
    '      <span>' + result.value + '</span>\n' +
    '    </span>' +
    '  </a>'
    + '</li>';
}

/**
 * Data modelling
 * @param result data
 * @param item
 * @returns {{link: string, description: *, ipa: (Document.ipa|*), value: string, pec: string}}
 */
function modelData(result, item = {}) {
  return {
    ipa: result.ipa,
    description: item.description || result.description,
    pec: item.pec || result.pec,
    link: '#',
    value: (item.description || result.description)
      + ' <strong>(' + result.ipa + ')</strong>',
  };
}

/**
 * populating form with remote searched data
 * @param data
 */
function populateAutocompleteBox(data) {
  let resultsElem = $('#risultatoRicerca');
  if (data.hits.hits.length > 0) {

    resultsElem.empty();
    //modelling data
    data.hits.hits
      .map(function (result) {
        return result._source;
      })
      .map(function (result) {
        let out = [];
        if (result.office && Array.isArray(result.office))
          result.office.forEach(function (item) {
            out.push(modelData(result, item));
          });
        out.push(modelData(result));
        return out;
      })
      .forEach(function (r) {
        r.forEach(function (result) {
          resultsElem.append(getResultElement(result));
        });
      });

    //showing list
    resultsElem.addClass('autocomplete-list-show');

    $('.result-item').click(function (e) {
      $('#ipa').val(this.dataset.ipa);
      $('label[for=\'ipa\']').addClass('active');
      $('#nomeAmministrazione').val(this.dataset.description);
      $('label[for=\'nomeAmministrazione\']').addClass('active');
      $('#pec').val(this.dataset.pec);
      $('label[for=\'pec\']').addClass('active');
      $('#risultatoRicerca').empty();
      $('#ricercaAmministrazione').val(this.dataset.description);
      resultsElem.removeClass('autocomplete-list-show');
      ipaInput.setCustomValidity('');
      ipaInput.checkValidity();

      //prevent default link action
      e.preventDefault();
    });
  }
}


/**
 * setting up key listener for autocomplete input box
 */
$('#ricercaAmministrazione').on('keyup', function (e) {
  $('#risultatoRicerca').empty();

  if (this.value.length < 2) {
    $('#risultatoRicerca').removeClass('autocomplete-list-show');
    return;
  }
  if (e.which == 13) {
    e.preventDefault();
  }
  let query = $('#ricercaAmministrazione').val();
  $.getJSON({
    /* global ES_URL */
    url: ES_URL,
    contentType: 'application/json; charset=UTF-8',
    type: 'POST',
    dataType: 'json',
    data: JSON.stringify({
      query: {
        bool: {
          should: [
            {
              nested: {
                path: 'office',
                query: {
                  multi_match: {
                    query: query,
                    operator: 'and',
                    fields: [
                      'office.code',
                      'office.description'
                    ]
                  }
                }
              }
            },
            {
              multi_match: {
                query: query,
                operator: 'and',
                fields: [
                  'ipa',
                  'description'
                ]
              }
            }
          ]
        }
      }
    }),
    success: populateAutocompleteBox
  });
});

//hack to make readonly fields required and validate them
$('.readonly').on('keydown paste', function (e) {
  e.preventDefault();
});

