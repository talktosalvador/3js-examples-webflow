//uniform mat4 projectionMatrix;
//uniform mat4 viewMatrix;
//uniform mat4 modelMatrix;
uniform vec2 uFrequency;
uniform float uTime;

//attribute vec3 position;
attribute float aRandom;
//attribute vec2 uv;

varying float vRandom;
varying vec2 vUv;
varying float vElevation;

void main()
{
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
//    modelPosition.z += sin(modelPosition.x * uFrequency.x - uTime) * 0.1;
//    modelPosition.z += sin(modelPosition.y * uFrequency.y - uTime) * 0.05;
//    modelPosition.z += aRandom * 0.04;

    float elevation = sin(modelPosition.x * uFrequency.x - uTime) * 0.01;
    elevation += sin(modelPosition.y * uFrequency.y - uTime) * 0.01;
    modelPosition.z += elevation;

    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;
    gl_Position = projectedPosition;
    vRandom = aRandom;
    vUv = uv;
    vElevation = elevation;

}