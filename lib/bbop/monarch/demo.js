
importPackage(java.io);
importPackage(Packages.org.semanticweb.owlapi.model);
importPackage(Packages.org.semanticweb.owlapi.io);
importPackage(Packages.com.google.gson);

load('api.js');

////////////////////////////////////////////////////////////////////
// 
// TESTING / EXAMPLE CODE
// 
// This will be executed on loading.
// Obviously this will be moved in future


// this is for demo purposes only.
// currently MUST be run within Rhino, NOT a browser.
// Uses E4X
function demoPhenotypePage(phenotype_id) {

    var e = new bbop.monarch.Engine();
    var info = e.fetchPhenotypeInfo(phenotype_id); // Limb-girdle muscle atrophy

    var synBlock = '';
    if (info.has_exact_synonym != null) {
        synBlock = info.has_exact_synonym.map( function(s) {return <li><span>{s}</span></li>  } ).join("\n");
    }

    textDescription = function() {
        var content = <></>;
        if (info.comments != null && info.comments[0] != null) {
            content += <span>{info.comments[0]}</span>;
        }
        return content;    
    };

    liSynonyms = function() {
        var content = <></>;
        if (info.has_exact_synonym != null) {
            for each (var s in info.has_exact_synonym) {
                content += <li>{s}</li>;
            }
        }
        return content;    
    };

    trDiseases = function() {
        var content = <></>;
        if (info.disease_associations != null) {
            for each (var a in info.disease_associations) {
                content += 
                    <tr>
                      <td>{a.disease.id}</td>
                      <td>{a.disease.label}</td>
                      <td>{a.onset}</td>
                      <td>{a.frequency}</td>
                      <td>{a.phenotype.id}</td>
                      <td>{a.phenotype.label}</td>
                    </tr>;
            }
        }
        return content;    
    };


    
    var html =
<html>
 <head>
  <link href="http://faculty.dbmi.pitt.edu/harryh/monarch/pages/styles/pages.css" rel="Stylesheet" media="screen"
      type="text/css"/> 

  <title>Monarch Phenotype: {info.label} </title>
 </head>
 <body>
  <h1 class="disname">{info.label}</h1>
  <div id = "description">{ textDescription() }</div>

  <div class ="detail-block,twocol">
   <b class="detail-block-header">Also known as...</b>
   <div class="detail-block-contents">
    <div class="col">
     <b>Synonyms</b>
        <ul>{liSynonyms()}</ul>
    </div>
   </div>
  </div>


  <div class="detail-block,twocol">
   <b class="detail-block-header">Diseases</b>
   <div class="detail-block-contents">
    <div class="col">
     <b>Human</b>
        <table>{trDiseases()}</table>
    </div>
    <div class="col">
     <b>Non-Human (TODO)</b>
    </div>
   </div>
  </div>

 </body>

</html>;

    return html;
}



function t1() {
    var e = new bbop.monarch.Engine();
    var info = e.fetchClassInfo("UBERON_0000017");
    print(JSON.stringify(info));
}
function t2() {
    var e = new bbop.monarch.Engine();
    var info = e.fetchPhenotypeInfo("HP_0003797"); // Limb-girdle muscle atrophy
    print(JSON.stringify(info));
}
function t3() {
    var phenotype_id = "HP_0003325"; // Limb-girdle muscle weakness
    print( demoPhenotypePage(phenotype_id) );
}
t3();
