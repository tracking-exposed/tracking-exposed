// @flow
/** @jsx h */
import {h, Component} from "preact";
import "./index.css";

type Props = {
  baseUrl: string,
  allEntities: string[],
};

type State = {
  entities: string[],
  suggestions: string[],
  query: string,
};

export default class WidgetRssFeeds extends Component<Props, State> {
  static defaultProps = {
    allEntities: [],
    baseUrl: "https://tracking.exposed/feeds",
  };

  state = {
    entities: [],
    suggestions: [],
    query: "",
  };

  constructor(props: Props) {
    super(
      Object.assign({}, props, {
        allEntities: props.allEntities.map((entity) =>
          entity.trim().toLowerCase(),
        ),
      }),
    );
  }

  inputElement: ?HTMLInputElement;

  handleSelect = (key: string, event: Event) => {
    event.preventDefault();
    this.selectSuggestion(key);
  };

  handleUnselect = (key: string, event: Event) => {
    event.preventDefault();
    this.unselectEntity(key);
  };

  handleHover = (key: string) => {
    this.setState({query: key});
  };

  handleKeyPress = (event: KeyboardEvent) => {
    const {query, suggestions} = this.state;
    switch (event.keyCode) {
      // press enter
      case 13: {
        if (query !== "") this.selectSuggestion(query);
        break;
      }
      // press up or down
      case 40:
      case 38: {
        let index =
          suggestions.indexOf(query) + (event.keyCode === 40 ? +1 : -1);
        if (index < 0) index = suggestions.length - 1;
        if (index >= suggestions.length) index = 0;
        this.setState({query: suggestions[index]});
        break;
      }
      // press escape
      case 27: {
        this.deselectInput();
        this.handleBlur();
        break;
      }
      default:
    }
  };

  handleFocus = () => {
    const {query} = this.state;
    this.setState({
      suggestions: this.suggestionsForQuery(query),
    });
  };

  handleBlur = () => {
    this.setState({query: "", suggestions: []});
  };

  handleQueryChange = () => {
    if (!this.inputElement) return;
    const query = this.inputElement.value;
    const suggestions = this.suggestionsForQuery(query);
    this.setState({
      query,
      suggestions,
    });
  };

  handleClipboard = (event: Event) => {
    event.preventDefault();
    const element = document.createElement("input");
    const body = document.getElementsByTagName("body")[0];
    body.append(element);
    element.value = this.url();
    element.select();
    document.execCommand("copy");
    element.remove();
  };

  selectSuggestion(key: string) {
    const {allEntities} = this.props;
    const {entities} = this.state;
    this.deselectInput();
    if (allEntities.indexOf(key) < 0) return;
    this.setState({
      query: "",
      entities: Array.from(new Set(entities.concat([key]))).sort((a, b) =>
        a.localeCompare(b),
      ),
      suggestions: [],
    });
  }

  unselectEntity(key: string) {
    const {entities} = this.state;
    this.deselectInput();
    this.setState({
      entities: Array.from(
        new Set(entities.filter((entity) => entity !== key)),
      ).sort((a, b) => a.localeCompare(b)),
      suggestions: [],
    });
  }

  deselectInput() {
    if (this.inputElement) this.inputElement.blur();
  }

  suggestionsForQuery(term: string): string[] {
    if (term.length < 1) return [];
    const pattern = new RegExp(`^${term}`, "i");
    return this.filterSuggestions((entity) => pattern.test(entity));
  }

  filterSuggestions(fn: (string) => boolean) {
    const {allEntities} = this.props;
    const {entities} = this.state;
    return allEntities.filter(
      (entity) => entities.indexOf(entity) < 0 && fn(entity),
    );
  }

  url() {
    const {baseUrl} = this.props;
    const {entities} = this.state;
    const baseName = entities.join("+");
    return `${
      baseUrl.slice(-1) === "/" ? baseUrl.slice(0, -1) : baseUrl
    }/${baseName}.xml`;
  }

  renderSuggestions() {
    const {suggestions, query} = this.state;
    return (
      <ul className="list pa0 shadow-1 overflow-y-scroll overflow-x-hidden z-999 mh-0 h5">
        {suggestions.map((suggestion) => (
          <li
            id={suggestion}
            key={suggestion}
            className={`pointer pl2 ${
              query === suggestion ? "bg-light-gray" : ""
            }`}
            data-role="suggestion"
            onMouseDown={(event) => this.handleSelect(suggestion, event)}
            onMouseOver={() => this.handleHover(suggestion)}
          >
            <span className="">{suggestion}</span>
          </li>
        ))}
      </ul>
    );
  }

  renderEntities() {
    const {entities} = this.state;
    return (
      <ul className="flex flex-wrap ma0 pa0">
        {entities.map((entity) => (
          <li
            className="entity-tag dib ma1 pt1 pr1 f4 bg-light-gray br4 mw-100 truncate flex justify-between"
            id={entity}
            key={entity}
            data-role="selected-entity"
          >
            <span className="ml2">{entity}</span>
            <span
              onClick={(event) => this.handleUnselect(entity, event)}
              className="w2 h2 mt0 mb0 rss-feeds-entity-icon r0 pointer"
            />
          </li>
        ))}
      </ul>
    );
  }

  renderUrl() {
    return (
      <div className="flex">
        <input className="w-75" value={this.url()} disabled />
        <button
          className="feeds-rss-copy-icon w3 h2 mt0 mb0"
          onClick={this.handleClipboard}
        />
      </div>
    );
  }

  render({allEntities}: Props, {query, suggestions, entities}: State) {
    return (
      <div className="flex flex-column relative">
        {entities.length > 0 ? this.renderUrl() : ""}
        {entities.length > 0 ? this.renderEntities() : ""}
        <label className="blue" data-role="label">
          {allEntities.length > 0
            ? "Choose entities:"
            : "No Entities to choose from."}
        </label>
        <input
          data-role="input"
          name="feeds-q"
          className="input-reset br4-l bb b--white-20 pb0"
          disabled={allEntities.length === 0}
          // eslint-disable-next-line no-return-assign
          ref={(element) => (this.inputElement = element)}
          placeholder="Start typing to explore entities."
          label=""
          autoComplete="off"
          spellCheck="false"
          aria-label="Search for Entities."
          onKeyUp={this.handleKeyPress}
          onFocus={this.handleFocus}
          onBlur={this.handleBlur}
          onInput={this.handleQueryChange}
          value={query}
        />
        {suggestions.length > 0 ? this.renderSuggestions() : ""}
      </div>
    );
  }
}
