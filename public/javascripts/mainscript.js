var today = new Date();
var day = today.getDate();
day ='#tanggal' + day;
var numFieldTrx = 2;
var autocompleteData = {};

$(document).ready(function() {
    $(".button-collapse").sideNav();
    $('.collapsible').collapsible(
        {hover: false}
    );
    $('select').material_select();
    $('.tooltipped').tooltip({delay: 50});

    //================ page add-stock ==================
    function ifNewKode(){
        $('select[id^=addStockKode]').change(function(){
            var value = $(this).val();
            var parentTR = $(this).closest('tr');
            var parent = $(this).closest('tr').find('td[id^=inputKodeBlock]');
            var uniqueNum = $(parent).attr('data');
            var parentBlock = $(parent).attr('id');
            if(value == "new"){
                $('.selectList'+ uniqueNum +'').remove();
                $('#'+parentBlock).append('<input class="inputListGroup" id="addStockKode-'+ uniqueNum +'" name="listStock['+ uniqueNum +'][kode]" type="text" required>');
                $(parentTR).find('input[id^=addStockNama]').attr('disabled',false);
                $(parentTR).find('input[id^=addStockNama]').removeClass('disabled');
                $(parentTR).find('input[id^=addStockMerek]').attr('disabled',false);
                $(parentTR).find('input[id^=addStockMerek]').removeClass('disabled');
                $(parentTR).find('input[id^=addStockJenis]').attr('disabled',false);
                $(parentTR).find('input[id^=addStockJenis]').removeClass('disabled');
                $(parentTR).find('textarea[id^=addStockDesc]').attr('disabled',false);
                $(parentTR).find('textarea[id^=addStockDesc]').removeClass('disabled');
                $(parentTR).find('textarea[id^=addStockCatatan]').attr('disabled',false);
                $(parentTR).find('textarea[id^=addStockCatatan]').removeClass('disabled');
                ifNewKode();
            }else{
                $.ajax({
                    url: './sending-code-content?id='+value,
                    type: "GET",
                    dataType: "json",
                    success: function (datas) {
                        $(parentTR).find('input[id^=addStockNama]').val(datas[0].nama);
                        $(parentTR).find('input[id^=addStockMerek]').val(datas[0].merek);
                        $(parentTR).find('input[id^=addStockJenis]').val(datas[0].jenis);
                        $(parentTR).find('textarea[id^=addStockDesc]').val(datas[0].deskripsi);
                        $(parentTR).find('textarea[id^=addStockCatatan]').val(datas[0].catatan);
                    }
                });
            }
        });

        $('input[id^=addStockKode]').change(function(){
            var value = $(this).val();
            var parentTR = $(this).closest('tr');
            $.ajax({
                url: './sending-code-content?name='+encodeURIComponent(value),
                type: "GET",
                dataType: "json",
                success: function (datas) {
                    if(datas.length != 0){
                        $(parentTR).find('input[id^=addStockNama]').val(datas[0].nama);
                        $(parentTR).find('input[id^=addStockMerek]').val(datas[0].merek);
                        $(parentTR).find('input[id^=addStockJenis]').val(datas[0].jenis);
                        $(parentTR).find('textarea[id^=addStockDesc]').val(datas[0].deskripsi);
                        $(parentTR).find('textarea[id^=addStockCatatan]').val(datas[0].catatan);
                        $(parentTR).find('input[id^=addStockNama]').attr('disabled',true);
                        $(parentTR).find('input[id^=addStockNama]').addClass('disabled');
                        $(parentTR).find('input[id^=addStockJenis]').attr('disabled',true);
                        $(parentTR).find('input[id^=addStockJenis]').addClass('disabled');
                        $(parentTR).find('textarea[id^=addStockDesc]').attr('disabled',true);
                        $(parentTR).find('textarea[id^=addStockDesc]').addClass('disabled');
                        $(parentTR).find('textarea[id^=addStockCatatan]').attr('disabled',true);
                        $(parentTR).find('textarea[id^=addStockCatatan]').addClass('disabled');
                        $(parentTR).closest('form').find('button[id^=addCodeSubmit]').attr('disabled',true);
                        $(parentTR).closest('form').find('button[id^=addCodeSubmit]').addClass('disabled');
                    }else{
                        $(parentTR).find('input[id^=addStockNama]').val('');
                        $(parentTR).find('input[id^=addStockMerek]').val('');
                        $(parentTR).find('input[id^=addStockJenis]').val('');
                        $(parentTR).find('textarea[id^=addStockDesc]').val('');
                        $(parentTR).find('textarea[id^=addStockCatatan]').val('');
                        $(parentTR).find('input[id^=addStockNama]').attr('disabled',false);
                        $(parentTR).find('input[id^=addStockNama]').removeClass('disabled');
                        $(parentTR).find('input[id^=addStockMerek]').attr('disabled',false);
                        $(parentTR).find('input[id^=addStockMerek]').removeClass('disabled');
                        $(parentTR).find('input[id^=addStockJenis]').attr('disabled',false);
                        $(parentTR).find('input[id^=addStockJenis]').removeClass('disabled');
                        $(parentTR).find('textarea[id^=addStockDesc]').attr('disabled',false);
                        $(parentTR).find('textarea[id^=addStockDesc]').removeClass('disabled');
                        $(parentTR).find('textarea[id^=addStockCatatan]').attr('disabled',false);
                        $(parentTR).find('textarea[id^=addStockCatatan]').removeClass('disabled');
                        $(parentTR).closest('form').find('button[id^=addCodeSubmit]').attr('disabled',false);
                        $(parentTR).closest('form').find('button[id^=addCodeSubmit]').removeClass('disabled');
                    }
                }
            });
        });

        $('input[id^=addStockHargabeli], input[id^=addStockHargajual]').each(function(){
          $(this).keyup(function(){
              var number = ($(this).val() != '' && $(this).val() != 'NaN') ? parseInt($(this).val().replace(/[^0-9]/gi, '')) : 0;
              $(this).val(Intl.NumberFormat('en-IND').format(number))
          });
        });
    }

    ifNewKode();
    $("#btnAddRow").click(function () {
        var optionsKode = [];
        $.ajax({
            url: './sending-code',
            type: "GET",
            dataType: "json",
            success: function (datas) {
                for (var keysKode in datas) {
                    if (!datas.hasOwnProperty(keysKode)) continue;
                    var resKode = datas[keysKode];
                    optionsKode.push('<option value="' + resKode.idkode + '">' + resKode.kode + '</option>');
                }

                var appendText = '' +
                    '<tr class="addedRow'+ numFieldTrx +'">' +
                    '<td data="'+ numFieldTrx +'" id="inputKodeBlock'+ numFieldTrx +'">' +
                    '<select class="inputListGroup selectList'+ numFieldTrx +'" id="addStockKode-'+ numFieldTrx +'" name="listStock['+ numFieldTrx +'][kode]" required>' +
                    '<option value="" disabled selected>Pilih Kode</option>' +
                    '<option value="new">Tambah baru (+)</option>' +
                    optionsKode +
                    '<option value="new">Tambah baru (+)</option>' +
                    '</select>' +
                    '</td>' +
                    '<td><input class="inputListGroup disabled" id="addStockMerek-'+ numFieldTrx +'" name="listStock['+ numFieldTrx +'][merek]" type="text" disabled></td>' +
                    '<td><input class="inputListGroup disabled" id="addStockNama-'+ numFieldTrx +'" name="listStock['+ numFieldTrx +'][nama]" type="text" disabled></td>' +
                    '<td><input class="inputListGroup disabled" id="addStockJenis-'+ numFieldTrx +'" name="listStock['+ numFieldTrx +'][jenis]" type="text" disabled></td>' +
                    '<td><input class="inputListGroup" id="addStockHargabeli-'+ numFieldTrx +'" name="listStock['+ numFieldTrx +'][hargabeli]" type="text" required></td>' +
                    '<td><input class="inputListGroup" id="addStockHargajual-'+ numFieldTrx +'" name="listStock['+ numFieldTrx +'][hargajual]" type="text" required></td>' +
                    '<td><textarea class="materialize-textarea inputListGroup disabled" id="addStockDesc-'+ numFieldTrx +'" name="listStock['+ numFieldTrx +'][deskripsi]" disabled></textarea></td>' +
                    '<td><input class="inputListGroup" id="addStockJumlah-'+ numFieldTrx +'" name="listStock['+ numFieldTrx +'][jumlah]" type="number" required></td>' +
                    '<td><textarea class="materialize-textarea inputListGroup disabled" id="addStockCatatan-'+ numFieldTrx +'" name="listStock['+ numFieldTrx +'][catatan]" disabled></textarea></td>' +
                    '<td class="center"><a class="btn-floating btn waves-effect waves-light red darken-3" name="btnRemRow-'+ numFieldTrx +'" id="'+ numFieldTrx +'" title="Hapus Baris"><i class="material-icons">remove</i></a></td>' +
                    '</tr>' +
                    '';
                $("#addStockBlock").append(appendText);
                $("select").material_select();
                numFieldTrx++;

                $('[name^=btnRemRow]').click(function () {
                    var numToRem = $(this).attr('id');
                    var elm = ".addedRow"+ numToRem;

                    $(elm).remove();
                });
                ifNewKode();
            }
        });
    });
    //================ page add-stock end ==================
    //================ page add-code start ==================

    $("#btnAddRowCode").click(function () {
        $.ajax({
            url: './sending-code',
            type: "GET",
            dataType: "json",
            success: function (datas) {
                var appendText = '' +
                    '<tr class="addedRow'+ numFieldTrx +'">' +
                    '<td data="'+ numFieldTrx +'" id="inputKodeBlock'+ numFieldTrx +'">' +
                    '<input class="inputListGroup" id="addStockKode-'+ numFieldTrx +'" name="listStock['+ numFieldTrx +'][kode]" type="text" required>' +
                    '</select>' +
                    '</td>' +
                    '<td><input class="inputListGroup disabled" id="addStockMerek-'+ numFieldTrx +'" name="listStock['+ numFieldTrx +'][merek]" type="text"></td>' +
                    '<td><input class="inputListGroup disabled" id="addStockNama-'+ numFieldTrx +'" name="listStock['+ numFieldTrx +'][nama]" type="text"></td>' +
                    '<td><input class="inputListGroup disabled" id="addStockJenis-'+ numFieldTrx +'" name="listStock['+ numFieldTrx +'][jenis]" type="text"></td>' +
                    '<td><textarea class="materialize-textarea inputListGroup disabled" id="addStockDesc-'+ numFieldTrx +'" name="listStock['+ numFieldTrx +'][deskripsi]"></textarea></td>' +
                    '<td><textarea class="materialize-textarea inputListGroup disabled" id="addStockCatatan-'+ numFieldTrx +'" name="listStock['+ numFieldTrx +'][catatan]"></textarea></td>' +
                    '<td class="center"><a class="btn-floating btn waves-effect waves-light red darken-3" name="btnRemRow-'+ numFieldTrx +'" id="'+ numFieldTrx +'" title="Hapus Baris"><i class="material-icons">remove</i></a></td>' +
                    '</tr>' +
                    '';
                $("#addStockBlock").append(appendText);
                numFieldTrx++;

                $('[name^=btnRemRow]').click(function () {
                    var numToRem = $(this).attr('id');
                    var elm = ".addedRow"+ numToRem;

                    $(elm).remove();
                });
                ifNewKode();
            }
        });
    });
    //================ page add-stock end ==================
    //================ page add-code start ==================
    function trxPageFunc (){
        $('input[id^=trxKode]').change(function(){
            var value = $(this).val();
            var parentTr = $(this).closest('tr');
            var paretnTable = $(this).closest('table');
            $.ajax({
                url: './sending-content-by-name?name='+encodeURIComponent(value),
                type: "GET",
                dataType: "json",
                success: function (datas) {
                    if(datas.length != 0){
                        var nama = datas[0].nama;
                        var merek = datas[0].merek;
                        var jenis = datas[0].jenis;
                        var deskripsi = datas[0].deskripsi;
                        var hargaJual = datas[0].hargajual || 0 ;
                    console.log(datas[0].hargajual);
                        var detailText = nama +" || "+ merek +" || "+ jenis +" \n"+ deskripsi +"";
                        $(parentTr).find('pre[id^=detailTrx]').text(detailText);
                        $(parentTr).find('span[id^=spanHarga]').text(Intl.NumberFormat('en-IND').format(parseInt(hargaJual)));
                        $(parentTr).find('span[id^=spanTotal]').text("0");
                        $(parentTr).find('input[id^=trxJumlah]').val("0");
                        //$(parentTr).find('span[id^=spanHarga]').text(hargaJual);

                        $(parentTr).find('input[id^=trxJumlah]').attr('disabled',false);
                        $(parentTr).find('input[id^=trxJumlah]').removeClass('disabled');
                        $(parentTr).closest('form').find('#trxSubmit').attr('disabled',false);
                        $(parentTr).closest('form').find('#trxSubmit]').removeClass('disabled');
                    }else{
                        $(parentTr).find('pre[id^=detailTrx]').text("");
                        $(parentTr).find('span[id^=spanHarga]').text("");
                        $(parentTr).find('span[id^=spanTotal]').text("");
                        $(parentTr).find('input[id^=trxJumlah]').val("0");
                        $(parentTr).find('input[id^=trxJumlah]').attr('disabled',true);
                        $(parentTr).find('input[id^=trxJumlah]').addClass('disabled');
                        $(parentTr).closest('form').find('#trxSubmit').attr('disabled',true);
                        $(parentTr).closest('form').find('#trxSubmit').addClass('disabled');
                    }
                }
            })
        });
    }

    trxPageFunc();
    if($('#trxSubmit').length > 0){
        $.ajax({
            url: './sending-full-content',
            type: "GET",
            dataType: "json",
            success: function (datas) {
                for (var keyDatas in datas) {
                    if (!datas.hasOwnProperty(keyDatas)) continue;
                    var resDatas = datas[keyDatas];
                    autocompleteData[resDatas.kode] = null;
                }
                $('input.autocompleteTrx').autocomplete({
                    data: autocompleteData

                });
            }
        });
    }
    $("#btnAddRowTrx").click(function () {
        $.ajax({
            url: './sending-full-content',
            type: "GET",
            dataType: "json",
            success: function (datas) {
                var appendText = '' +
                    '<tr class="bordered addedRow'+ numFieldTrx +'">' +
                    '<td><input class="inputListGroup autocompleteTrx'+ numFieldTrx +'" id="trxKode-'+ numFieldTrx +'" name="listTrx['+ numFieldTrx +'][kode]" type="text"></td>' +
                    '<td><pre id="detailTrx'+ numFieldTrx +'" class="mt-0"></pre></td>' +
                    '<td><input class="inputListGroup" id="trxJumlah-'+ numFieldTrx +'" name="listTrx['+ numFieldTrx +'][jumlah]" type="number" required></td>' +
                    '<td class="center-align"><span id="spanHarga'+ numFieldTrx +'"></span></td>' +
                    '<td><span id="spanTotal'+ numFieldTrx +'"> </span></td>' +
                    '<td class="center"><a class="btn-floating btn waves-effect waves-light red darken-3" name="btnRemRow-'+ numFieldTrx +'" id="'+ numFieldTrx +'" title="Hapus Baris"><i class="material-icons">remove</i></a></td>' +
                    '</tr>' +
                    '';
                $("#trxBlock").append(appendText);
                for (var keyDatas in datas) {
                    if (!datas.hasOwnProperty(keyDatas)) continue;
                    var resDatas = datas[keyDatas];
                    autocompleteData[resDatas.kode] = null;
                }
                $('input.autocompleteTrx'+ numFieldTrx +'').autocomplete({
                    data: autocompleteData

                });
                numFieldTrx++;

                $('[name^=btnRemRow]').click(function () {
                    var numToRem = $(this).attr('id');
                    var elm = ".addedRow"+ numToRem;

                    $(elm).remove();
                });
                trxPageFunc();
            }
        });
    });
    //================ page add-code end ==================
});

