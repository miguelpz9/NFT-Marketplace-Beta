import '@google/model-viewer';

const Model = (file) => (
    <div id="card">
        <model-viewer
            src={file}
            ios-src=""
            alt="A 3D model of an astronaut"
            shadow-intensity="1"
            camera-controls
            auto-rotate
            ar
        ></model-viewer>
    </div>
)

export default Model;
