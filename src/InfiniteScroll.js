import React, {Component} from 'react';
import PropTypes from 'prop-types';

export default class InfiniteScroll extends Component {
  static propTypes = {
    children: PropTypes.oneOfType([PropTypes.object, PropTypes.array])
      .isRequired,
    element: PropTypes.string,
    hasMore: PropTypes.bool,
    initialLoad: PropTypes.bool,
    isReverse: PropTypes.bool,
    loader: PropTypes.object,
    loadMore: PropTypes.func.isRequired,
    pageStart: PropTypes.number,
    ref: PropTypes.func,
    threshold: PropTypes.number,
    useCapture: PropTypes.bool,
    scrollElementSelector: PropTypes.string,
    useWindow: PropTypes.bool,
  };

  static defaultProps = {
    element: 'div',
    hasMore: false,
    initialLoad: true,
    pageStart: 0,
    ref: null,
    threshold: 250,
    useWindow: true,
    isReverse: false,
    useCapture: false,
    loader: null,
    scrollElementSelector: '',
  };

  constructor(props) {
    super(props);

    this.scrollListener = this.scrollListener.bind(this);
  }

  componentDidMount() {
    this.pageLoaded = this.props.pageStart;
    this.attachScrollListener();
  }

  componentDidUpdate() {
    this.attachScrollListener();
  }

  componentWillUnmount() {
    this.detachScrollListener();
  }

  // Set a defaut loader for all your `InfiniteScroll` components
  setDefaultLoader(loader) {
    this.defaultLoader = loader;
  }

  getScrollElement() {
    let scrollEl = window;

    if (this.props.scrollElementSelector) {
      scrollEl = document.querySelector(this.props.scrollElementSelector);
    } else if (this.props.useWindow === false) {
      scrollEl = this.scrollComponent.parentNode;
    }

    return scrollEl;
  }

  detachScrollListener() {
    let scrollEl = this.getScrollElement();

    if (scrollEl) {
      scrollEl.removeEventListener(
        'mousewheel',
        this.mousewheelListener,
        this.props.useCapture,
      );
      scrollEl.removeEventListener(
        'scroll',
        this.scrollListener,
        this.props.useCapture,
      );
    }

    window.removeEventListener(
      'resize',
      this.scrollListener,
      this.props.useCapture,
    );
  }

  attachScrollListener() {
    if (!this.props.hasMore) {
      return;
    }

    let scrollEl = this.getScrollElement();

    if (scrollEl) {
      scrollEl.addEventListener(
        'mousewheel',
        this.mousewheelListener,
        this.props.useCapture,
      );
      scrollEl.addEventListener(
        'scroll',
        this.scrollListener,
        this.props.useCapture,
      );
    }

    window.addEventListener(
      'resize',
      this.scrollListener,
      this.props.useCapture,
    );

    if (this.props.initialLoad) {
      this.scrollListener();
    }
  }

  mousewheelListener(e) {
    // Prevents Chrome hangups
    // See: https://stackoverflow.com/questions/47524205/random-high-content-download-time-in-chrome/47684257#47684257
    if (e.deltaY === 1) {
      e.preventDefault();
    }
  }

  scrollListener() {
    const el = this.props.scrollElementSelector
      ? document.querySelector(this.props.scrollElementSelector).children[0]
      : this.scrollComponent;
    const scrollEl = window;

    let offset;
    if (this.props.useWindow && !this.props.scrollElementSelector) {
      const doc =
        document.documentElement || document.body.parentNode || document.body;
      const scrollTop =
        scrollEl.pageYOffset !== undefined
          ? scrollEl.pageYOffset
          : doc.scrollTop;
      if (this.props.isReverse) {
        offset = scrollTop;
      } else {
        offset =
          this.calculateTopPosition(el) +
          (el.offsetHeight - scrollTop - window.innerHeight);
      }
    } else {
      if (this.props.isReverse) {
        offset = el.parentNode.scrollTop;
      } else {
        offset =
          el.scrollHeight -
          el.parentNode.scrollTop -
          el.parentNode.clientHeight;
      }
    }

    if (offset < Number(this.props.threshold)) {
      this.detachScrollListener();
      // Call loadMore after detachScrollListener to allow for non-async loadMore functions
      if (typeof this.props.loadMore === 'function') {
        this.props.loadMore((this.pageLoaded += 1));
      }
    }
  }

  calculateTopPosition(el) {
    if (!el) {
      return 0;
    }
    return el.offsetTop + this.calculateTopPosition(el.offsetParent);
  }

  render() {
    const {
      children,
      element,
      hasMore,
      initialLoad,
      isReverse,
      loader,
      loadMore,
      pageStart,
      ref,
      threshold,
      useCapture,
      useWindow,
      scrollElementSelector,
      ...props
    } = this.props;

    props.ref = node => {
      this.scrollComponent = node;
      if (ref) {
        ref(node);
      }
    };

    const childrenArray = [children];
    if (hasMore) {
      if (loader) {
        isReverse ? childrenArray.unshift(loader) : childrenArray.push(loader);
      } else if (this.defaultLoader) {
        isReverse
          ? childrenArray.unshift(this.defaultLoader)
          : childrenArray.push(this.defaultLoader);
      }
    }
    return React.createElement(element, props, childrenArray);
  }
}
