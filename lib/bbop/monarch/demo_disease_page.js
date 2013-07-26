
load('api.js');

////////////////////////////////////////////////////////////////////
// 
// TESTING / EXAMPLE CODE
// 
// this is for demo purposes only.
// currently MUST be run within Rhino, NOT a browser.
// Uses E4X
function demoDiseasePage(disease_id) {

    var e = new bbop.monarch.Engine();
    var info = e.fetchDiseaseInfo(disease_id); 

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

    trPhenotypes = function() {
        var content = <></>;
        if (info.phenotype_associations != null) {
            for each (var a in info.phenotype_associations) {
                content += 
                    <tr>
                      <td>{a.disease.id}</td>
                      <td>{a.disease.label}</td>
                      <td>{a.onset}</td>
                      <td>{a.frequency}</td>
                      <td>{a.phenotype.id}</td>
                      <td>{a.phenotype.label}</td>
                      <td>SOURCE: {a.source}</td>
                    </tr>;
            }
        }
        return content;    
    };

    trGenes = function() {
        var content = <></>;
        if (info.gene_associations != null) {
            for each (var a in info.gene_associations) {
                content += 
                    <tr>
                      <td>{a.disease.id}</td>
                      <td>{a.disease.label}</td>
                      <td>{a.inheritance}</td>
                      <td>{a.gene.id}</td>
                      <td>{a.gene.label}</td>
                      <td>SOURCE: {a.source}</td>
                    </tr>;
            }
        }
        return content;    
    };

    trAlleles = function() {
        var content = <></>;
        if (info.alleles != null) {
            for each (var a in info.alleles) {
                content += 
                    <tr>
                      <td>{a.disease.id}</td>
                      <td>{a.disease.label}</td>
                      <td>{a.allele.id}</td>
                      <td>{a.allele.link}</td>
                      <td>{a.allele.mutation}</td>
                      <td>{a.allele.label}</td>
                      <td>SOURCE: {a.source}</td>
                    </tr>;
            }
        }
        return content;    
    };

    trModels = function() {
        var content = <></>;
        if (info.models != null) {
            for each (var a in info.models) {
                content += 
                    <tr>
                      <td>{a.disease.id}</td>
                      <td>{a.disease.label}</td>
                      <td>{a.type.label}</td>
                      <td>{a.model.id}</td>
                      <td>{a.model.label}</td>
                      <td>{a.model.type.label} / {a.model.type.parent}</td>
                      <td>{a.model.taxon.label}</td>
                      <td>SOURCE: {a.source}</td>
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

  <title>Monarch Disease: {info.label} </title>
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
   <b class="detail-block-header">Phenotypes</b>
   <div class="detail-block-contents">
    <div class="col">
     <b>Human</b>
        <table>{trPhenotypes()}</table>
    </div>
    <div class="col">
     <b>Non-Human (TODO)</b>
    </div>
   </div>
  </div>

  <div class="detail-block,twocol">
   <b class="detail-block-header">Genes</b>
   <div class="detail-block-contents">
    <div class="col">
     <b>Human</b>
        <table>{trGenes()}</table>
    </div>
    <div class="col">
     <b>Non-Human (TODO)</b>
    </div>
   </div>
  </div>

  <div class="detail-block,twocol">
   <b class="detail-block-header">Alleles</b>
   <div class="detail-block-contents">
    <div class="col">
     <b>Human</b>
        <table>{trAlleles()}</table>
    </div>
    <div class="col">
     <b>Non-Human (TODO)</b>
    </div>
   </div>
  </div>


  <div class="detail-block,twocol">
   <b class="detail-block-header">Models</b>
   <div class="detail-block-contents">
    <div class="col">
     <b>Human</b>
        <table>{trModels()}</table>
    </div>
    <div class="col">
     <b></b>
    </div>
   </div>
  </div>

 </body>

</html>;

    return html;
}


function demo() {
    var disease_id = "DOID_14692"; // SMITH-LEMLI-OPITZ SYNDROME
    print( demoDiseasePage(disease_id) );
}
demo();
