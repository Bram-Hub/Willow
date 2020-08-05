const keybindingsVm = new Vue({
  el: "#keybindings-panel",
  components: {
    keybindings: {
      data: () => ({
        substitutions: substitutions,
        inverseSubstitutions: invertObject(substitutions),
        shortcuts: shortcuts,

        symbolsExpanded: true,
        actionsExpanded: true,
      }),
      methods: {
        changeSymbolKeybind: function(event, symbol) {
          // delete the old entry for this symbol
          delete this.substitutions[this.inverseSubstitutions[symbol]];

          this.substitutions[event.key] = symbol;
          this.inverseSubstitutions[symbol] = event.key;
        },
        changeActionKey: function(input, index){
          this.shortcuts[index].key = parseInt(input.target.value)
              ? parseInt(input.target.value)
              : input.target.value;
        },
      },
      watch: {
        inverseSubstitutions: {
          // watch for changes to inverseSubstitution because Vue cannot detect
          // property addition/deletion, only modification
          handler: function() {
            localStorage.setItem(
                "substitutions",
                JSON.stringify(this.substitutions)
            );
          },
          deep: true,
        },
        shortcuts: {
          handler: function() {
            localStorage.setItem("shortcuts", JSON.stringify(this.shortcuts));
          },
          deep: true,
        }
      },
      template: `
<div>
  <h3 style="margin-top: 0px; text-align: center;">Keybindings</h3>
  <h4 style="margin: 10px 0px;">Symbols <button @click="symbolsExpanded = !symbolsExpanded" class="expand-arrow">{{ symbolsExpanded ? "▼" : "►" }}</button></h4>
  <div v-if="symbolsExpanded">
    <table class="table-style-simple">
      <thead>
        <tr>
          <th>Symbol</th>
          <th class="col-key">Key</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="keybind, symbol, index in inverseSubstitutions">
          <td style="text-align: center;">{{ symbol.trim() }}</td>
          <td class="col-key"><input type="text" :value="keybind" style="text-align: center; width: 100%;" @keydown="changeSymbolKeybind($event, symbol)" @input="$event.target.value = inverseSubstitutions[symbol]"></td>
        </tr>
      </tbody>
    </table>
  </div>
  <h4 style="margin: 10px 0px;">Actions <button @click="actionsExpanded = !actionsExpanded" class="expand-arrow">{{ actionsExpanded ? "▼" : "►" }}</button></h4>
  <div v-if="actionsExpanded">
    <table class="table-style-simple">
      <tr>
        <th>Action</th>
        <th>Ctrl</th>
        <th class="col-key">Key</th>
      </tr>
      <tr v-for="shortcut, index in shortcuts">
        <td style="padding: 0px 2px;">{{ shortcut.callback.name.replace(/([A-Z])/g, " $1").replace(/^./, str => str.toUpperCase())}}</td>
        <td style="text-align: center;"><input type="checkbox" v-model="shortcut.ctrl"></td>
        <td class="col-key"><input type="text" maxlength="3" :value="shortcut.key" @input="changeActionKey($event, index)"></td>
      </tr>
    </table>
  </div>
</div>`
    },
  },
});
